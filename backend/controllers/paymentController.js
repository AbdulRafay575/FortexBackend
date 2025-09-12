const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const { processPayment } = require('../utils/paymentService');

// @desc    Process payment
// @route   POST /api/payments
// @access  Private
const processPaymentRequest = asyncHandler(async (req, res) => {
  const { orderId, paymentDetails } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to pay for this order');
  }

  if (order.paymentStatus === 'Paid') {
    res.status(400);
    throw new Error('Order is already paid');
  }

  // Process payment with bank API
  const paymentResult = await processPayment({
    amount: order.totalAmount,
    ...paymentDetails
  });

  if (paymentResult.success) {
    order.paymentStatus = 'Paid';
    order.paymentDetails = {
      transactionId: paymentResult.transactionId,
      timestamp: paymentResult.timestamp
    };
    await order.save();

    res.json({
      success: true,
      message: 'Payment successful',
      transactionId: paymentResult.transactionId
    });
  } else {
    order.paymentStatus = 'Failed';
    order.paymentDetails = {
      error: paymentResult.error,
      timestamp: paymentResult.timestamp
    };
    await order.save();

    res.status(400);
    throw new Error(paymentResult.error || 'Payment failed');
  }
});

module.exports = {
  processPaymentRequest
};