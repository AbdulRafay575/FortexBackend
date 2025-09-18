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

  res.json(cart);
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, size, color, stylee, customText, pattern, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Validate size and color
  if (!product.availableSizes.includes(size)) {
    res.status(400);
    throw new Error('Invalid size for this product');
  }
  if (!product.availableColors.map(c => c.toLowerCase()).includes(color.toLowerCase())) {
    res.status(400);
    throw new Error('Invalid color for this product');
  }

  // Cloudinary design upload
  const designUrl = req.file ? req.file.path : null;
  const designCloudinaryId = req.file ? req.file.filename : null;

  const cartItem = {
    product: productId,
    size,
    color,
    stylee,
    design: designUrl,
    designCloudinaryId,
    customText,
    pattern,
    quantity: Number(quantity),
    priceAtAddition: product.price
  };

  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    const itemIndex = cart.items.findIndex(
      item =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color &&
        item.stylee === stylee &&
        item.customText === customText &&
        item.pattern === pattern &&
        item.design === designUrl
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

  cart.total = cart.items.reduce(
    (acc, item) => acc + item.priceAtAddition * item.quantity,
    0
  );

  const updatedCart = await cart.save();
  res.status(201).json(updatedCart);
});

// @desc    Update cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity, size, color, stylee, customText, pattern } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const itemIndex = cart.items.findIndex(
    item => item._id.toString() === req.params.itemId
  );
  if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in cart' });

  const item = cart.items[itemIndex];

  // Replace design if new file uploaded
  if (req.file) {
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

  if (quantity) item.quantity = Number(quantity);
  if (size) item.size = size;
  if (stylee) item.stylee = stylee;
  if (color) item.color = color;
  if (pattern) item.pattern = pattern;
  item.customText = customText !== undefined ? customText : item.customText;

  cart.total = cart.items.reduce(
    (acc, item) => acc + item.priceAtAddition * item.quantity,
    0
  );

  const updatedCart = await cart.save();
  res.json(updatedCart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error('Cart not found');

  const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.itemId);

  if (itemIndex > -1) {
    cart.items.splice(itemIndex, 1);
    cart.total = cart.items.reduce((acc, item) => acc + item.priceAtAddition * item.quantity, 0);
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
