const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderStatus,
  getOrders,
  handlePaymentCallback,
  getOrderStatus
} = require('../controllers/orderController');
const { protect, adminProtect } = require('../middleware/auth');

router.route('/')
  .post(protect, createOrder)
  .get(protect, getMyOrders);

router.route('/payment-callback')
  .post(handlePaymentCallback);

router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:orderId/status').get(protect, getOrderStatus);

// Admin routes
router.route('/admin/orders').get(adminProtect, getOrders);
router.route('/admin/orders/:id').put(adminProtect, updateOrderStatus);

module.exports = router;