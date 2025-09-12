const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/fileUpload'); // your multer config

router.route('/')
  .get(protect, getCart)
  .post(protect, upload, addToCart); // <-- attach multer middleware here

router.route('/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeFromCart);

module.exports = router;
