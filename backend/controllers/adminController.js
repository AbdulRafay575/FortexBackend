const Admin = require('../models/Admin');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const { generateToken } = require('../middleware/auth');

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
// const authAdmin = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   console.log('🔐 Login attempt:', email);

//   const admin = await Admin.findOne({ email });

//   if (!admin) {
//     console.log('❌ Admin not found for email:', email);
//     res.status(400);
//     throw new Error('Invalid email or password');
//   }

//   const isMatch = await admin.matchPassword(password);

//   console.log('🔍 Password match result:', isMatch);

//   if (isMatch) {
//     console.log('✅ Admin authenticated:', admin.email);
//     res.json({
//       _id: admin._id,
//       email: admin.email,
//       token: generateToken(admin._id)
//     });
//   } else {
//     console.log('❌ Password does not match for admin:', admin.email);
//     res.status(401);
//     throw new Error('Invalid email or password');
//   }
// });
const authAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', email);

  const admin = await Admin.findOne({ email });

  if (!admin) {
    console.log('❌ Admin not found for email:', email);
    res.status(400);
    throw new Error('Invalid email or password');
  }

  const isMatch = await admin.matchPassword(password); // Use bcrypt comparison

  console.log('🔍 Password match result:', isMatch);

  if (isMatch) {
    console.log('✅ Admin authenticated:', admin.email);
    res.json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id)
    });
  } else {
    console.log('❌ Password does not match for admin:', admin.email);
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new admin
// @route   POST /api/admin/register
// @access  Public (remove public later if needed)
const registerAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }

  const admin = await Admin.create({
    email,
    password, // Pre-save hook will hash this
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid admin data');
  }
});


// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
    const customers = await User.find({})
        .select('-password')
        .populate('orderHistory');

    res.json(customers);
});  


// @desc    Get customer by ID
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id)
    .select('-password')
    .populate('orderHistory');

  if (customer) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

module.exports = {
  authAdmin,
  getCustomers,
  getCustomerById,
  registerAdmin,
};