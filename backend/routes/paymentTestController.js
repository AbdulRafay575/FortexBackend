const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const { protect } = require('../middleware/auth'); // Your auth middleware

// Function to generate Hashv3
function generateHash(orderId, amount, currency, storeKey) {
  const hashString = orderId + amount + currency + storeKey;
  return crypto.createHash('sha512').update(hashString).digest('base64');
}

// @desc    Test Halkbank payment with Hashv3
// @route   POST /api/payments/test
// @access  Private
router.post(
  '/test',
  protect,
  asyncHandler(async (req, res) => {
    const { cardNumber, expiry, cvv, amount } = req.body;

    try {
      const orderId = `TEST-${Date.now()}`;
      const storeKey = 'SKEY0335'; // Your Storekey
      const currency = '807';

      // Hashv3 calculation
      const hash = generateHash(orderId, amount, currency, storeKey);

      // Prepare data for Halkbank API
      const paymentData = new URLSearchParams();
      paymentData.append('clientid', '180000335');
      paymentData.append('username', 'forteksapi');
      paymentData.append('password', 'TEmp.12960as25');
      paymentData.append('storetype', '3D_PAY_HOSTING');
      paymentData.append('orderid', orderId);
      paymentData.append('amount', amount);
      paymentData.append('currency', currency);
      paymentData.append('cardnumber', cardNumber);
      paymentData.append('cardexpired', expiry.replace('/', '')); // MMYY
      paymentData.append('cvv2', cvv);
      paymentData.append('hash', hash); // Hashv3
      paymentData.append('encoding', 'UTF-8');

      const response = await axios.post(
        'https://torus-stage-halkbankmacedonia.asseco-see.com.tr/fim/api',
        paymentData.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      res.json({
        success: true,
        data: response.data
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.response?.data || error.message
      });
    }
  })
);

module.exports = router;
