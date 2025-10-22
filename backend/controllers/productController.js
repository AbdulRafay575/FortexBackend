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
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log('REQ.BODY:', req.body);
    console.log('REQ.FILES:', req.files);

    const { name, description, price, availableSizes, availableColors, stylee } = req.body;

    const images = Array.isArray(req.files) && req.files.length > 0
      ? req.files.map((file, index) => ({
          url: file.path,
          cloudinaryId: file.filename || file.public_id || file.originalname,
          isPrimary: index === 0
        }))
      : [];

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = new Product({
      name,
      description,
      price,
      availableSizes: Array.isArray(availableSizes) ? availableSizes : (availableSizes ? JSON.parse(availableSizes) : []),
      availableColors: Array.isArray(availableColors) ? availableColors : (availableColors ? JSON.parse(availableColors) : []),
      stylee: stylee || 'Regular',
      images
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('🔥 CREATE PRODUCT ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});


// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, availableSizes, availableColors, stylee } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // FIXED: Handle new images properly
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        cloudinaryId: file.filename || file.public_id,
        isPrimary: false // New images are not primary by default
      }));
      
      // Add new images to existing ones
      product.images = [...product.images, ...newImages];
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    
    // FIXED: Handle arrays properly
    if (availableSizes) {
      product.availableSizes = Array.isArray(availableSizes) ? availableSizes : JSON.parse(availableSizes);
    }
    
    if (availableColors) {
      product.availableColors = Array.isArray(availableColors) ? availableColors : JSON.parse(availableColors);
    }
    
    product.stylee = stylee || product.stylee;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const imageIndex = product.images.findIndex(
    img => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    res.status(404);
    throw new Error('Image not found');
  }

  const imageToDelete = product.images[imageIndex];

  try {
    // Delete from Cloudinary
    await deleteFromCloudinary(imageToDelete.cloudinaryId);
    
    // Remove from product images array
    product.images.splice(imageIndex, 1);
    
    // If we deleted the primary image and there are other images, set first as primary
    if (imageToDelete.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();
    res.json({ message: 'Image deleted successfully', product });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500);
    throw new Error('Error deleting image');
  }
});

// @desc    Set primary image
// @route   PATCH /api/products/:id/images/:imageId/primary
// @access  Private/Admin
const setPrimaryImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Reset all images to non-primary
  product.images.forEach(img => {
    img.isPrimary = false;
  });

  // Set the specified image as primary
  const image = product.images.id(req.params.imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  image.isPrimary = true;
  await product.save();
  
  res.json({ message: 'Primary image updated successfully', product });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        for (const image of product.images) {
          await deleteFromCloudinary(image.cloudinaryId);
        }
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
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
  deleteProduct,
  deleteProductImage,
  setPrimaryImage
};