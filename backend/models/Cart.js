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
  stylee: {  // Shirt style
    type: String,
    required: false
  },
  design: {
    type: String, // Cloudinary URL
    required: false
  },
  designCloudinaryId: {
    type: String, // Cloudinary public_id
    required: false
  },
  customText: {
    type: String,
    required: false
  },
  pattern: {
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
