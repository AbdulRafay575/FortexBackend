const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  size: {
    type: String,
    enum: ['Small', 'Medium', 'Large', 'X-Large'],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  design: {
    type: String, // Path or URL to the design image
    required: false
  },
  customText: {
    type: String,
    required: false
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtAddition: {
    type: Number,
    required: true
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  total: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', CartSchema);