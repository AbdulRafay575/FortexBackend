const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  availableSizes: {
    type: [String],
    enum: ['Small', 'Medium', 'Large', 'X-Large'],
    required: true
  },
  availableColors: {
    type: [String],
    required: true
  },
  image: {
    type: String, // Can store image URL or local path
    required: false // Optional, but can be made required if every product must have an image
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
