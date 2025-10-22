const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { designUpload } = require('../config/cloudinary'); // Use design upload for cart

router.route('/')
  .get(protect, getCart)
  .post(protect, designUpload.single('design'), addToCart);

router.route('/:itemId')
  .put(protect, designUpload.single('design'), updateCartItem)
  .delete(protect, removeFromCart);

module.exports = router;