const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
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

  // Add order to user's order history
  await User.findByIdAndUpdate(req.user._id, {
    $push: { orderHistory: createdOrder._id }
  });

  // Clear cart
  await Cart.findByIdAndDelete(cart._id);

  // Send order confirmation email
  const user = await User.findById(req.user._id);
  await sendOrderConfirmationEmail(user, createdOrder);

  res.status(201).json(createdOrder);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product');

  if (order) {
    // Check if order belongs to user or is admin
    if ((!req.user || order.user.toString() !== req.user._id.toString()) && !req.admin) {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product');
  res.json(orders);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.paymentStatus = 'Paid';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (order) {
    order.orderStatus = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email');
  res.json(orders);
});

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  getOrders
};