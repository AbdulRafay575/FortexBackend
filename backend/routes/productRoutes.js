// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, adminProtect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary'); // Cloudinary upload middleware

// Public Routes
router.route('/')
  .get(getProducts);

router.route('/:id')
  .get(getProductById);

// Admin Routes with Cloudinary image upload
router.route('/')
  .post(adminProtect, upload.single('image'), createProduct);

router.route('/:id')
  .put(adminProtect, upload.single('image'), updateProduct)
  .delete(adminProtect, deleteProduct);

module.exports = router;