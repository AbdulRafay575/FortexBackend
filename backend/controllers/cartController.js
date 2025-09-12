const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const upload = require('../utils/fileUpload');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart) {
    // Auto-create empty cart
    cart = new Cart({
      user: req.user._id,
      items: [],
      total: 0
    });
    await cart.save();
  }

  res.json(cart);
});


// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, color, customText, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // console.log('Product availableColors:', product.availableColors);
  // console.log('Requested color:', color);
  // Validate size and color
  if (!product.availableSizes.includes(size)) {
    res.status(400);
    throw new Error('Invalid size for this product');
  }

if (!product.availableColors.map(c => c.toLowerCase()).includes(color.toLowerCase())) {
    res.status(400);
    throw new Error('Invalid color for this product');
  }

  const designPath = req.file ? `/designs/${req.file.filename}` : null;

  const cartItem = {
    product: productId,
    size,
    color,
    design: designPath,
    customText,
    quantity: Number(quantity),
    priceAtAddition: product.price
  };

  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
              item.size === size && 
              item.color === color &&
              item.customText === customText &&
              item.design === designPath
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push(cartItem);
    }
  } else {
    cart = new Cart({
      user: req.user._id,
      items: [cartItem]
    });
  }

  cart.total = cart.items.reduce((acc, item) => acc + (item.priceAtAddition * item.quantity), 0);

  const updatedCart = await cart.save();
  res.status(201).json(updatedCart);
});


// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const fs = require('fs');
const path = require('path');

const updateCartItem = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    try {
      const { quantity, size, color, customText } = req.body;

      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(
        item => item._id.toString() === req.params.itemId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      const item = cart.items[itemIndex];

      // Replace design image if a new one was uploaded
      if (req.file) {
        if (item.design) {
          const oldPath = path.join(__dirname, '..', 'public', item.design);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        item.design = `/designs/${req.file.filename}`;
      }

      // Update other fields
      if (quantity) item.quantity = Number(quantity);
      if (size) item.size = size;
      if (color) item.color = color;
      item.customText = customText !== undefined ? customText : item.customText;

      // Update cart total
      cart.total = cart.items.reduce((acc, item) => acc + (item.priceAtAddition * item.quantity), 0);

      const updatedCart = await cart.save();
      res.json(updatedCart);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error while updating cart item' });
    }
  });
};


// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === req.params.itemId
  );

  if (itemIndex > -1) {
    cart.items.splice(itemIndex, 1);
    
    // Calculate total
    cart.total = cart.items.reduce((acc, item) => acc + (item.priceAtAddition * item.quantity), 0);

    const updatedCart = await cart.save();
    res.json(updatedCart);
  } else {
    res.status(404);
    throw new Error('Item not found in cart');
  }
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};