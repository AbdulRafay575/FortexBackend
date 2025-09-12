const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Admin = require('../models/Admin');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }

      // If not found as user, try admin
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.admin = admin;
        return next();
      }

      res.status(401);
      throw new Error('Not authorized, token does not match user or admin');
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const adminProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized as admin, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized as admin, no token');
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = { protect, adminProtect, generateToken };