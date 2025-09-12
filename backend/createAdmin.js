const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const newAdmin = new Admin({
      email: 'admin@example.com',
      password: 'MyStrongPass123'
    });

    await newAdmin.save();
    console.log('✅ Admin created:', newAdmin);
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
