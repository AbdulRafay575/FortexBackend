const express = require('express');
const router = express.Router();
const { processPaymentRequest } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, processPaymentRequest);

module.exports = router;