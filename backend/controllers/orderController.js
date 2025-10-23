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
    console.log('🛒 CREATE ORDER STARTED ======================');
    console.log('📦 Shipping details:', shippingDetails);

    // Get user cart with populated products
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      console.log('❌ No items in cart for user:', req.user._id);
      return res.status(400).json({
        success: false,
        message: 'No items in cart'
      });
    }

    console.log('📋 Cart items count:', cart.items.length);
    console.log('💰 Cart total:', cart.total);

    // Create order with cart items including design information
    const order = new Order({
      user: req.user._id,
      orderId: `ORD-${Date.now()}`,
      items: cart.items.map(item => ({
        product: item.product._id,
        size: item.size,
        color: item.color,
        design: item.design,
        designCloudinaryId: item.designCloudinaryId,
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
    console.log('✅ Order created successfully:', createdOrder.orderId);

    // Prepare bank payment parameters
    console.log('🏦 Preparing bank payment parameters...');
    const bankParams = prepareBankPayment(createdOrder);

    console.log('📤 Sending bank payment data to frontend');
    res.json({
      success: true,
      message: 'Order created successfully',
      order: createdOrder,
      bankPayment: bankParams
    });

  } catch (error) {
    console.error('❌ CREATE ORDER ERROR:', error);
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
    okUrl: `${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}/payment-success.html?orderId=${order.orderId}`,
    failUrl: `${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}/payment-failed.html?orderId=${order.orderId}`,
    rnd: Math.random().toString().substring(2, 18),
    currency: '807',
    storetype: '3D_PAY_HOSTING',
    islemtipi: 'Auth',
    taksit: '',
    lang: 'en',
    encoding: 'UTF-8'
  };

  // 🔐 HASHv3: concatenate key=value&key=value... (sorted alphabetically)
  const sortedKeys = Object.keys(params).sort();
  const hashText = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&storekey=${storeKey}`;
  
  const hash = crypto.createHash('sha512').update(hashText, 'utf8').digest('base64');

  return {
    bankUrl,
    params: { ...params, hash }
  };
};

// @desc    Handle bank payment callback
// @route   POST /api/orders/payment-callback
// @access  Public
console.log('🔍 Verifying callback hash using Hashv3...');
console.log("🔙 Bank Callback Data:", req.body);

const storeKey = process.env.BANK_STORE_KEY || 'SKEY0335';

// Remove hash params before building string
const callbackParams = { ...req.body };
delete callbackParams.hash;
delete callbackParams.HASH;
delete callbackParams.signature;
console.log("🔙 Bank Callback Data:", req.body);

// Sort and rebuild like Hashv3
const sortedKeys = Object.keys(callbackParams).sort();
const hashText = sortedKeys.map(k => `${k}=${callbackParams[k]}`).join('&') + `&storekey=${storeKey}`;
const expectedHash = crypto.createHash('sha512').update(hashText, 'utf8').digest('base64');

console.log('Expected Hash (last 10):', expectedHash.slice(-10));
console.log('Received Hash (last 10):', (req.body.hash || req.body.HASH || '').slice(-10));

if ((req.body.hash || req.body.HASH) !== expectedHash) {
  console.error('❌ HASH VERIFICATION FAILED — Payment will be marked failed');
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid callback - Hash verification failed' 
  });
}

console.log('✅ Hash verified successfully!');


// @desc    Get order status
// @route   GET /api/orders/:orderId/status
// @access  Private
const getOrderStatus = asyncHandler(async (req, res) => {
  try {
    console.log('📊 GET ORDER STATUS ======================');
    console.log('   Order ID:', req.params.orderId);
    console.log('   User ID:', req.user._id);

    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user._id
    });

    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Order found:', order.orderId);
    console.log('   Payment Status:', order.paymentStatus);
    console.log('   Order Status:', order.orderStatus);
    console.log('   Total Amount:', order.totalAmount);

    res.json({
      success: true,
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    });

  } catch (error) {
    console.error('❌ GET ORDER STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting order status'
    });
  }
});

// Other existing functions with added logging...
const getOrderById = asyncHandler(async (req, res) => {
  console.log('🔍 GET ORDER BY ID:', req.params.id);
  
  const order = await Order.findById(req.params.id).populate('items.product');
  if (order) {
    console.log('✅ Order found:', order.orderId);
    res.json({
      success: true,
      data: order
    });
  } else {
    console.log('❌ Order not found:', req.params.id);
    res.status(404);
    throw new Error('Order not found');
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  console.log('📋 GET MY ORDERS for user:', req.user._id);
  
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  console.log(`✅ Found ${orders.length} orders for user`);
  
  res.json({
    success: true,
    data: orders
  });
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
  console.log('💳 UPDATE ORDER TO PAID:', req.params.id);
  
  const order = await Order.findById(req.params.id);
  if (order) {
    console.log('✅ Updating order payment status to Paid');
    order.paymentStatus = 'Paid';
    order.paymentDetails = { paidAt: Date.now(), ...req.body };
    const updatedOrder = await order.save();
    res.json({
      success: true,
      data: updatedOrder
    });
  } else {
    console.log('❌ Order not found for payment update:', req.params.id);
    res.status(404);
    throw new Error('Order not found');
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  console.log('🔄 UPDATE ORDER STATUS:', req.params.id);
  console.log('   New status:', req.body.status);
  
  const order = await Order.findById(req.params.id);
  if (order) {
    console.log('✅ Updating order status from', order.orderStatus, 'to', req.body.status);
    order.orderStatus = req.body.status || order.orderStatus;
    const updatedOrder = await order.save();
    res.json({
      success: true,
      data: updatedOrder
    });
  } else {
    console.log('❌ Order not found for status update:', req.params.id);
    res.status(404);
    throw new Error('Order not found');
  }
});

const getOrders = asyncHandler(async (req, res) => {
  console.log('👑 ADMIN: GET ALL ORDERS');
  
  const orders = await Order.find({}).populate('user', 'id name email').populate('items.product');
  console.log(`✅ Found ${orders.length} total orders`);
  
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