// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary'); // ✅ reuse your product upload middleware

router.route('/')
  .get(protect, getCart)
  .post(protect, upload.single('design'), addToCart); // upload design to Cloudinary

router.route('/:itemId')
  .put(protect, upload.single('design'), updateCartItem) // allow replacing design
  .delete(protect, removeFromCart);

module.exports = router;
