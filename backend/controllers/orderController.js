const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// @desc    Create new order and prepare bank payment
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { shippingDetails } = req.body;
    console.log('Creating order with shipping details:', shippingDetails);

    // Get user cart with populated products
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in cart'
      });
    }

    console.log('Cart items:', cart.items);

    // Create order with cart items including design information
    const order = new Order({
      user: req.user._id,
      orderId: `ORD-${Date.now()}`,
      items: cart.items.map(item => ({
        product: item.product._id,
        size: item.size,
        color: item.color,
        design: item.design, // Include design URL
        designCloudinaryId: item.designCloudinaryId, // Include Cloudinary ID
        customText: item.customText,
        pattern: item.pattern,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtAddition
      })),
      shippingDetails,
      totalAmount: cart.total,
      paymentStatus: 'Pending'
    });

    const createdOrder = await order.save();
    console.log('Order created:', createdOrder);

    // Prepare bank payment parameters
    const bankParams = prepareBankPayment(createdOrder);

    res.json({
      success: true,
      message: 'Order created successfully',
      order: createdOrder,
      bankPayment: bankParams
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating order'
    });
  }
});

// @desc    Prepare bank payment parameters
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

// @desc    Handle bank payment callback
// @route   POST /api/orders/payment-callback
// @access  Public
const handlePaymentCallback = asyncHandler(async (req, res) => {
  try {
    const { ReturnOid, Response, TransId, AuthCode, Hash } = req.body;
    console.log('Payment callback received:', { ReturnOid, Response });

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
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid callback' 
      });
    }

    const order = await Order.findOne({ orderId: ReturnOid });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    if (Response === 'Approved') {
      order.paymentStatus = 'Paid';
      order.paymentDetails = {
        transactionId: TransId,
        authCode: AuthCode,
        paidAt: new Date()
      };
      
      // Clear cart and send confirmation email
      await Cart.findOneAndDelete({ user: order.user });
      const user = await User.findById(order.user);
      await sendOrderConfirmationEmail(user, order);
      
      console.log('Payment successful for order:', order.orderId);
    } else {
      order.paymentStatus = 'Failed';
      console.log('Payment failed for order:', order.orderId);
    }

    await order.save();

    res.json({ 
      success: true, 
      status: order.paymentStatus,
      orderId: order.orderId
    });

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment callback'
    });
  }
});

// @desc    Get order status
// @route   GET /api/orders/:orderId/status
// @access  Private
const getOrderStatus = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    });

  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting order status'
    });
  }
});

// Other existing functions remain the same...
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product');
  if (order) {
    res.json({
      success: true,
      data: order
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json({
    success: true,
    data: orders
  });
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.paymentStatus = 'Paid';
    order.paymentDetails = { paidAt: Date.now(), ...req.body };
    const updatedOrder = await order.save();
    res.json({
      success: true,
      data: updatedOrder
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.orderStatus = req.body.status || order.orderStatus;
    const updatedOrder = await order.save();
    res.json({
      success: true,
      data: updatedOrder
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name email').populate('items.product');
  res.json({
    success: true,
    data: orders
  });
});

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