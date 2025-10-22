const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const { deleteFromCloudinary } = require('../config/cloudinary');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart) {
    cart = new Cart({
      user: req.user._id,
      items: [],
      total: 0
    });
    await cart.save();
  }

  res.json({
    success: true,
    data: cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  try {
    console.log('Add to cart request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { productId, size, color, stylee, customText, pattern, quantity = 1 } = req.body;

    // Validate required fields
    if (!productId || !size || !color) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, size, and color are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate size and color
    if (!product.availableSizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid size for this product'
      });
    }

    const availableColors = product.availableColors.map(c => c.toLowerCase());
    if (!availableColors.includes(color.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid color for this product'
      });
    }

    // Handle design upload
    let designUrl = null;
    let designCloudinaryId = null;
    
    if (req.file) {
      designUrl = req.file.path;
      designCloudinaryId = req.file.filename;
      console.log('Design uploaded:', { designUrl, designCloudinaryId });
    }

    const cartItem = {
      product: productId,
      size,
      color,
      stylee: stylee || 'Regular',
      design: designUrl,
      designCloudinaryId,
      customText: customText || '',
      pattern: pattern || '',
      quantity: parseInt(quantity),
      priceAtAddition: product.price
    };

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      // Check if item already exists with same specifications
      const itemIndex = cart.items.findIndex(
        item =>
          item.product.toString() === productId &&
          item.size === size &&
          item.color.toLowerCase() === color.toLowerCase() &&
          item.stylee === (stylee || 'Regular') &&
          item.customText === (customText || '') &&
          item.pattern === (pattern || '') &&
          item.design === designUrl
      );

      if (itemIndex > -1) {
        // Update quantity if item exists
        cart.items[itemIndex].quantity += parseInt(quantity);
      } else {
        // Add new item
        cart.items.push(cartItem);
      }
    } else {
      // Create new cart
      cart = new Cart({
        user: req.user._id,
        items: [cartItem]
      });
    }

    // Calculate total
    cart.total = cart.items.reduce(
      (acc, item) => acc + (item.priceAtAddition * item.quantity),
      0
    );

    cart.updatedAt = new Date();

    const updatedCart = await cart.save();
    await updatedCart.populate('items.product');

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: updatedCart
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        await deleteFromCloudinary(req.file.filename);
      } catch (deleteError) {
        console.error('Error cleaning up uploaded design:', deleteError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding item to cart'
    });
  }
});

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  try {
    const { quantity, size, color, stylee, customText, pattern } = req.body;
    console.log('Update cart item request:', req.params.itemId, req.body);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const item = cart.items[itemIndex];

    // Replace design if new file uploaded
    if (req.file) {
      // Delete old design from Cloudinary if exists
      if (item.designCloudinaryId) {
        try {
          await deleteFromCloudinary(item.designCloudinaryId);
        } catch (err) {
          console.error('Error deleting old design from Cloudinary:', err);
        }
      }
      item.design = req.file.path;
      item.designCloudinaryId = req.file.filename;
    }

    // Update fields
    if (quantity !== undefined) item.quantity = parseInt(quantity);
    if (size) item.size = size;
    if (stylee !== undefined) item.stylee = stylee;
    if (color) item.color = color;
    if (pattern !== undefined) item.pattern = pattern;
    if (customText !== undefined) item.customText = customText;

    // Recalculate total
    cart.total = cart.items.reduce(
      (acc, item) => acc + (item.priceAtAddition * item.quantity),
      0
    );

    cart.updatedAt = new Date();

    const updatedCart = await cart.save();
    await updatedCart.populate('items.product');

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: updatedCart
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    
    // Clean up uploaded file if error occurs
    if (req.file) {
      try {
        await deleteFromCloudinary(req.file.filename);
      } catch (deleteError) {
        console.error('Error cleaning up uploaded design:', deleteError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating cart item'
    });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const itemToRemove = cart.items[itemIndex];

    // Delete design from Cloudinary if exists
    if (itemToRemove.designCloudinaryId) {
      try {
        await deleteFromCloudinary(itemToRemove.designCloudinaryId);
      } catch (err) {
        console.error('Error deleting design from Cloudinary:', err);
      }
    }

    // Remove item from cart
    cart.items.splice(itemIndex, 1);
    
    // Recalculate total
    cart.total = cart.items.reduce(
      (acc, item) => acc + (item.priceAtAddition * item.quantity),
      0
    );

    cart.updatedAt = new Date();

    const updatedCart = await cart.save();
    await updatedCart.populate('items.product');

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: updatedCart
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error removing item from cart'
    });
  }
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};