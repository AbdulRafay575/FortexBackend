const multer = require('multer');
const path = require('path');

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './backend/public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const checkFileType = (file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  return extname && mimetype ? cb(null, true) : cb('Error: Images only!');
};

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => checkFileType(file, cb)
});

module.exports = productUpload;
