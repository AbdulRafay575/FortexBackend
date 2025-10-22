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
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);

    const { name, description, price, availableSizes, availableColors, stylee } = req.body;
    
    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required fields'
      });
    }

    // Handle multiple images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file, index) => ({
        url: file.path,
        cloudinaryId: file.filename,
        isPrimary: index === 0 // First image is primary by default
      }));
    }

    // Parse arrays if they come as strings
    const sizes = Array.isArray(availableSizes) 
      ? availableSizes 
      : (availableSizes ? JSON.parse(availableSizes) : []);

    const colors = Array.isArray(availableColors) 
      ? availableColors 
      : (availableColors ? JSON.parse(availableColors) : []);

    const product = new Product({
      name,
      description: description || '',
      price: parseFloat(price),
      availableSizes: sizes,
      availableColors: colors,
      stylee: stylee || 'Regular',
      images
    });

    const createdProduct = await product.save();
    
    res.status(201).json({
      success: true,
      data: createdProduct
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    
    // Delete uploaded images if product creation fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await deleteFromCloudinary(file.filename);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const { name, description, price, availableSizes, availableColors, stylee } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        cloudinaryId: file.filename,
        isPrimary: false
      }));
      
      // Add new images to existing ones
      product.images = [...product.images, ...newImages];
    }

    // Update fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (availableSizes) {
      product.availableSizes = Array.isArray(availableSizes) 
        ? availableSizes 
        : JSON.parse(availableSizes);
    }
    if (availableColors) {
      product.availableColors = Array.isArray(availableColors) 
        ? availableColors 
        : JSON.parse(availableColors);
    }
    if (stylee) product.stylee = stylee;

    const updatedProduct = await product.save();
    
    res.json({
      success: true,
      data: updatedProduct
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    
    // Delete uploaded images if update fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await deleteFromCloudinary(file.filename);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
});

// @desc    Delete a product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const imageIndex = product.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const imageToDelete = product.images[imageIndex];

    // Delete from Cloudinary
    await deleteFromCloudinary(imageToDelete.cloudinaryId);
    
    // Remove from product images array
    product.images.splice(imageIndex, 1);
    
    // If we deleted the primary image and there are other images, set first as primary
    if (imageToDelete.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();
    
    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: product
    });
    
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image'
    });
  }
});

// @desc    Set primary image
// @route   PATCH /api/products/:id/images/:imageId/primary
// @access  Private/Admin
const setPrimaryImage = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Reset all images to non-primary
    product.images.forEach(img => {
      img.isPrimary = false;
    });

    // Set the specified image as primary
    const image = product.images.id(req.params.imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    image.isPrimary = true;
    await product.save();
    
    res.json({
      success: true,
      message: 'Primary image updated successfully',
      data: product
    });
    
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting primary image'
    });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          await deleteFromCloudinary(image.cloudinaryId);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }
    }
    
    await product.deleteOne();
    
    res.json({
      success: true,
      message: 'Product removed successfully'
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
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