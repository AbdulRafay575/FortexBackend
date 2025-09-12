const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.route('/register').post(registerUser);
router.route('/login').post(authUser);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;