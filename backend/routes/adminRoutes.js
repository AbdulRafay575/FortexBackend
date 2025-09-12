const express = require('express');
const router = express.Router();
const {
  authAdmin,
  getCustomers,
  getCustomerById,
  registerAdmin, // add this
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/auth');

router.route('/register').post(registerAdmin);  // Route to create admin for testing
router.route('/login').post(authAdmin);
router.route('/customers').get(adminProtect, getCustomers);
router.route('/customers/:id').get(adminProtect, getCustomerById);

module.exports = router;
