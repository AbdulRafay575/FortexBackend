const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Load env vars
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// console.log('JWT_SECRET Loaded:', process.env.JWT_SECRET);

// Connect to database
connectDB();


// Route files
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentTestRoutes = require('./routes/paymentTestController');

const app = express();

// Body parser
// Body parser for JSON
app.use(express.json());

// Optional: body parser for URL-encoded data (forms)
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const corsOptions = {
  origin: ['http://127.0.0.1:5500','https://fortex.com.mk'], // allow multiple
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Set static folder
app.use('/designs', express.static(path.join(__dirname, 'public/designs')));

// Mount routers
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api/payments', paymentTestRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});