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

const app = express();

// Body parser
// Body parser for JSON
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Optional: body parser for URL-encoded data (forms)
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const corsOptions = {
  origin: ['http://127.0.0.1:5500','https://fortex.com.mk','https://fortexadmin.onrender.com'], // allow multiple
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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});








// const express = require('express');
// const crypto = require('crypto');
// const app = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // 🟢 CREATE PAYMENT (Redirect to 3D Secure Page)
// app.post('/create-payment', (req, res) => {
//     const { amount, orderId } = req.body;

//     // === Your Halkbank test credentials ===
//     const clientId = "180000335";
//     const storeKey = "SKEY0335";
//     const okUrl = "http://localhost:5000/payment-result";
//     const failUrl = "http://localhost:5000/payment-result";
//     const currency = "807";
//     const tranType = "Auth";
//     const storeType = "3D_PAY_HOSTING";
//     const lang = "en";
//     const taksit = "";
//     const encoding = "UTF-8";
//     const rnd = Math.random().toString();
    
//     // Format amount correctly
//     const formattedAmount = parseFloat(amount).toFixed(2);

//     // === CORRECT Hash Calculation ===
//     // According to Halkbank documentation, the order should be:
//     // clientId + orderId + amount + okUrl + failUrl + tranType + instalment + rnd + storeKey
//     const hashStr = clientId + 
//                    orderId + 
//                    formattedAmount + 
//                    okUrl + 
//                    failUrl + 
//                    tranType + 
//                    taksit + 
//                    rnd + 
//                    storeKey;

//     console.log("🔹 Hash String Before Hashing:");
//     console.log(hashStr);
    
//     const hash = crypto.createHash('sha512').update(hashStr).digest('base64');
    
//     console.log("🔹 Generated Hash:");
//     console.log(hash);

//     // === Payment Form ===
//     const formHtml = `
//         <html>
//         <head>
//             <meta charset="UTF-8">
//             <title>Redirecting to Payment...</title>
//         </head>
//         <body>
//             <p>Redirecting to secure payment page...</p>
//             <form id="bankForm" method="post" action="https://torus-stage-halkbankmacedonia.asseco-see.com.tr/fim/est3Dgate">
//                 <input type="hidden" name="clientid" value="${clientId}" />
//                 <input type="hidden" name="storetype" value="${storeType}" />
//                 <input type="hidden" name="amount" value="${formattedAmount}" />
//                 <input type="hidden" name="oid" value="${orderId}" />
//                 <input type="hidden" name="okUrl" value="${okUrl}" />
//                 <input type="hidden" name="failUrl" value="${failUrl}" />
//                 <input type="hidden" name="currency" value="${currency}" />
//                 <input type="hidden" name="lang" value="${lang}" />
//                 <input type="hidden" name="tranType" value="${tranType}" />
//                 <input type="hidden" name="rnd" value="${rnd}" />
//                 <input type="hidden" name="hash" value="${hash}" />
//                 <input type="hidden" name="taksit" value="${taksit}" />
//                 <input type="hidden" name="encoding" value="${encoding}" />
//                 <noscript>
//                     <input type="submit" value="Click to continue to payment">
//                 </noscript>
//             </form>
//             <script>
//                 document.getElementById('bankForm').submit();
//             </script>
//         </body>
//         </html>
//     `;

//     res.send(formHtml);
// });

// // 🟢 PAYMENT RESULT CALLBACK (Simplified - Remove hash verification for now)
// app.post('/payment-result', (req, res) => {
//     console.log("🔸 Payment Response Received:");
//     console.log("Full Response Body:", JSON.stringify(req.body, null, 2));

//     const response = req.body.Response;
//     const errorMsg = req.body.ErrMsg;
//     const procReturnCode = req.body.ProcReturnCode;
//     const authCode = req.body.AuthCode;
//     const transId = req.body.TransId;

//     // For now, skip hash verification to test if the main flow works
//     if (response === "Approved" && procReturnCode === "00") {
//         console.log("✅ Payment Successful!");
//         console.log(`Transaction ID: ${transId}, Auth Code: ${authCode}`);
//         res.send(`
//             <html>
//             <body>
//                 <h2>✅ Payment Successful!</h2>
//                 <p>Thank you for your order.</p>
//                 <p>Transaction ID: ${transId || 'N/A'}</p>
//                 <p>Authorization Code: ${authCode || 'N/A'}</p>
//                 <a href="/">Return to Store</a>
//             </body>
//             </html>
//         `);
//     } else {
//         console.log("❌ Payment Failed:", errorMsg || "Unknown error");
//         console.log("Response Code:", procReturnCode);
//         res.send(`
//             <html>
//             <body>
//                 <h2>❌ Payment Failed</h2>
//                 <p>Error: ${errorMsg || "Unknown error"}</p>
//                 <p>Response Code: ${procReturnCode}</p>
//                 <p>Error Code: ${req.body.ErrorCode || 'N/A'}</p>
//                 <a href="/test-payment">Try Again</a>
//             </body>
//             </html>
//         `);
//     }
// });

// // 🟢 Alternative Hash Calculation Method
// app.post('/create-payment-alt', (req, res) => {
//     const { amount, orderId } = req.body;

//     const clientId = "180000335";
//     const storeKey = "SKEY0335";
//     const okUrl = "http://localhost:5000/payment-result";
//     const failUrl = "http://localhost:5000/payment-result";
//     const currency = "807";
//     const tranType = "Auth";
//     const storeType = "3D_PAY_HOSTING";
//     const lang = "en";
//     const taksit = "";
//     const encoding = "UTF-8";
//     const rnd = Math.random().toString();
    
//     const formattedAmount = parseFloat(amount).toFixed(2);

//     // Try alternative hash calculation (without template literals)
//     const hashData = [
//         clientId,
//         orderId,
//         formattedAmount,
//         okUrl,
//         failUrl,
//         tranType,
//         taksit,
//         rnd,
//         storeKey
//     ].join('');
    
//     console.log("🔹 Alternative Hash String:");
//     console.log(hashData);

//     const hash = crypto.createHash('sha512').update(hashData, 'utf8').digest('base64');
    
//     console.log("🔹 Alternative Generated Hash:");
//     console.log(hash);

//     const formHtml = `
//         <html>
//         <body>
//             <form id="bankForm" method="post" action="https://torus-stage-halkbankmacedonia.asseco-see.com.tr/fim/est3Dgate">
//                 <input type="hidden" name="clientid" value="${clientId}" />
//                 <input type="hidden" name="storetype" value="${storeType}" />
//                 <input type="hidden" name="amount" value="${formattedAmount}" />
//                 <input type="hidden" name="oid" value="${orderId}" />
//                 <input type="hidden" name="okUrl" value="${okUrl}" />
//                 <input type="hidden" name="failUrl" value="${failUrl}" />
//                 <input type="hidden" name="currency" value="${currency}" />
//                 <input type="hidden" name="lang" value="${lang}" />
//                 <input type="hidden" name="tranType" value="${tranType}" />
//                 <input type="hidden" name="rnd" value="${rnd}" />
//                 <input type="hidden" name="hash" value="${hash}" />
//                 <input type="hidden" name="taksit" value="${taksit}" />
//                 <input type="hidden" name="encoding" value="${encoding}" />
//             </form>
//             <script>document.getElementById('bankForm').submit();</script>
//         </body>
//         </html>
//     `;

//     res.send(formHtml);
// });

// // 🟢 Test endpoint
// app.get('/test-payment', (req, res) => {
//     res.send(`
//         <html>
//         <body>
//             <h2>Test Payment - Method 1</h2>
//             <form action="/create-payment" method="post">
//                 <label>Amount:</label>
//                 <input type="text" name="amount" value="1.00" required><br><br>
//                 <label>Order ID:</label>
//                 <input type="text" name="orderId" value="TEST${Date.now()}" required><br><br>
//                 <button type="submit">Pay Now (Method 1)</button>
//             </form>
            
//             <hr>
            
//             <h2>Test Payment - Method 2</h2>
//             <form action="/create-payment-alt" method="post">
//                 <label>Amount:</label>
//                 <input type="text" name="amount" value="1.00" required><br><br>
//                 <label>Order ID:</label>
//                 <input type="text" name="orderId" value="TEST${Date.now()}" required><br><br>
//                 <button type="submit">Pay Now (Method 2)</button>
//             </form>
            
//             <h3>Test Card Details:</h3>
//             <p>Card Number: 4799150896081734</p>
//             <p>Expiry: 12/28</p>
//             <p>CVV: 000</p>
//         </body>
//         </html>
//     `);
// });

// app.listen(5000, () => {
//     console.log('✅ Server running on http://localhost:5000');
//     console.log('📝 Test payment page: http://localhost:5000/test-payment');
// });