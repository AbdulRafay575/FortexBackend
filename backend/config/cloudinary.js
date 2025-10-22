// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// UPDATED: Configure storage for multiple files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tshirt-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

// UPDATED: Use multer for multiple files
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  }
});

// Function to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  upload,
  deleteFromCloudinary,
  cloudinary
};