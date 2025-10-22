const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  setPrimaryImage
} = require('../controllers/productController');
const { protect, adminProtect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public Routes
router.route('/')
  .get(getProducts);

router.route('/:id')
  .get(getProductById);

// Admin Routes with multiple image upload
router.route('/')
  .post(adminProtect, upload.array('images', 10), createProduct); // Increased to 10 images max

router.route('/:id')
  .put(adminProtect, upload.array('images', 10), updateProduct)
  .delete(adminProtect, deleteProduct);

// Image management routes
router.route('/:id/images/:imageId')
  .delete(adminProtect, deleteProductImage);

router.route('/:id/images/:imageId/primary')
  .patch(adminProtect, setPrimaryImage);

module.exports = router;