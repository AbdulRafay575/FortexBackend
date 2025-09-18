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
   stylee: {               // <-- NEW FIELD
    type: String,
        required: true
  },
  image: {
    type: String, // Will store Cloudinary URL
    required: false
  },
  cloudinaryId: { // Store Cloudinary public_id for future management
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);