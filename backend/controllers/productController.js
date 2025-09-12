const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});
// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, availableSizes, availableColors } = req.body;
  
  // Cloudinary provides these in req.file
  const image = req.file ? req.file.path : null;
  const cloudinaryId = req.file ? req.file.filename : null;

  const product = new Product({
    name,
    description,
    price,
    availableSizes: Array.isArray(availableSizes) ? availableSizes : JSON.parse(availableSizes || '[]'),
    availableColors: Array.isArray(availableColors) ? availableColors : JSON.parse(availableColors || '[]'),
    image,
    cloudinaryId
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, availableSizes, availableColors } = req.body;
  
  const product = await Product.findById(req.params.id);

  if (product) {
    // If new image is uploaded, delete old one from Cloudinary
    if (req.file && product.cloudinaryId) {
      try {
        await deleteFromCloudinary(product.cloudinaryId);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.availableSizes = availableSizes || product.availableSizes;
    product.availableColors = availableColors || product.availableColors;
    
    if (req.file) {
      product.image = req.file.path;
      product.cloudinaryId = req.file.filename;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Delete image from Cloudinary if exists
    if (product.cloudinaryId) {
      try {
        await deleteFromCloudinary(product.cloudinaryId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }
    
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};