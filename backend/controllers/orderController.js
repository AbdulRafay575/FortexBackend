const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// ==============================
// 1️⃣ CREATE ORDER + BANK PAYMENT
// ==============================
const createOrder = asyncHandler(async (req, res) => {
  const { shippingDetails } = req.body;

  // Get user cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  // Create order
  const order = new Order({
    user: req.user._id,
    orderId: `ORD-${Date.now()}`,
    items: cart.items.map(item => ({
      product: item.product._id,
      size: item.size,
      color: item.color,
      design: item.design,
      customText: item.customText,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtAddition
    })),
    shippingDetails,
    totalAmount: cart.total,
    paymentStatus: 'Pending'
  });

  const createdOrder = await order.save();

  // Prepare bank payment parameters
  const bankParams = prepareBankPayment(createdOrder);

  res.json({
    success: true,
    order: createdOrder,
    bankPayment: bankParams
  });
});

// ==============================
// 2️⃣ BANK PAYMENT PARAMETERS
// ==============================
const prepareBankPayment = (order) => {
  const clientId = process.env.BANK_CLIENT_ID || '180000335';
  const storeKey = process.env.BANK_STORE_KEY || 'SKEY0335';
  const bankUrl = process.env.BANK_3D_URL || 'https://torus-stage-halkbankmacedonia.asseco-see.com.tr/fim/est3Dgate';

  const params = {
    clientid: clientId,
    amount: order.totalAmount.toFixed(2),
    oid: order.orderId,
    okUrl: `${process.env.FRONTEND_URL}/payment-success.html?orderId=${order.orderId}`,
    failUrl: `${process.env.FRONTEND_URL}/payment-failed.html?orderId=${order.orderId}`,
    rnd: Math.random().toString(),
    currency: '807',
    storetype: '3D_PAY_HOSTING',
    islemtipi: 'Auth',
    taksit: '',
    lang: 'en',
    encoding: 'UTF-8'
  };

  // Generate secure hash
  const hashString = [
    params.clientid,
    params.oid,
    params.amount,
    params.okUrl,
    params.failUrl,
    params.islemtipi,
    params.taksit,
    params.rnd,
    storeKey
  ].join('');

  const hash = crypto.createHash('sha512').update(hashString).digest('base64');

  return {
    bankUrl,
    params: { ...params, hash }
  };
};

// ==============================
// 3️⃣ PAYMENT CALLBACK HANDLER
// ==============================
const handlePaymentCallback = asyncHandler(async (req, res) => {
  const { ReturnOid, Response, TransId, AuthCode, Hash } = req.body;

  const storeKey = process.env.BANK_STORE_KEY || 'SKEY0335';
  const expectedHash = crypto.createHash('sha512')
    .update([
      req.body.clientid,
      req.body.oid,
      req.body.amount,
      req.body.okUrl,
      req.body.failUrl,
      req.body.islemtipi,
      req.body.taksit,
      req.body.rnd,
      storeKey
    ].join(''))
    .digest('base64');

  if (Hash !== expectedHash) {
    console.error('Invalid hash in payment callback');
    return res.status(400).json({ success: false, message: 'Invalid callback' });
  }

  const order = await Order.findOne({ orderId: ReturnOid });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (Response === 'Approved') {
    order.paymentStatus = 'Paid';
    order.paymentDetails = {
      transactionId: TransId,
      authCode: AuthCode,
      paidAt: new Date()
    };
  } else {
    order.paymentStatus = 'Failed';
  }

  await order.save();

  if (order.paymentStatus === 'Paid') {
    await Cart.findOneAndDelete({ user: order.user });
    const user = await User.findById(order.user);
    await sendOrderConfirmationEmail(user, order);
  }

  res.json({ success: true, status: order.paymentStatus });
});

// ==============================
// 4️⃣ GET ORDER STATUS (CHECK PAYMENT)
// ==============================
const getOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    orderId: req.params.orderId,
    user: req.user._id
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({
    orderId: order.orderId,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt
  });
});

// ==============================
// 5️⃣ OTHER (OPTIONAL) ORDER HELPERS
// ==============================
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) res.json(order);
  else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.paymentStatus = 'Paid';
    order.paymentDetails = { paidAt: Date.now(), ...req.body };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.status = req.body.status || order.status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name email');
  res.json(orders);
});

// ==============================
// ✅ EXPORTS (All Functions Defined)
// ==============================
module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  getOrders,
  handlePaymentCallback,
  getOrderStatus
};
