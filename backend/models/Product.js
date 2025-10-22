// models/Product.js
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
  stylee: {
    type: String,
    required: true
  },
  // UPDATED: Changed from single image to array of images
  images: [{
    url: {
      type: String, // Cloudinary URL
      required: true
    },
    cloudinaryId: {
      type: String, // Cloudinary public_id
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);