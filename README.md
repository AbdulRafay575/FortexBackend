markdown
# T-Shirt Customization E-Commerce Platform

This is a full-stack e-commerce platform for custom t-shirt orders with user management, cart functionality, and order processing.

## Features

- User registration and authentication
- Product browsing and customization
- Shopping cart management
- Order processing with payment integration
- Order history and tracking
- Admin dashboard for product and order management

## Technologies

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: HTML5, CSS3, JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Simulated bank API integration
- **Email Notifications**: Nodemailer

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation


Install backend dependencies:

bash
cd backend
npm install
Create a .env file in the backend directory with the following content:

env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/tshirt-customization
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USERNAME=rosemarie47@ethereal.email #EMAIL_USERNAME=your_mailtrap_username
EMAIL_PASSWORD=7ZmMGZ6ASvjPBS457C #EMAIL_PASSWORD=your_mailtrap_password



Start the MongoDB server (if using local instance).

Start the backend server:

bash
npm start
Open the frontend in a browser by opening the frontend/index.html file.

Admin Access
To create an admin account:

Connect to your MongoDB instance:

bash
mongo
Use the tshirt-customization database:

bash
use tshirt-customization
Insert an admin record (replace email and password with your desired credentials):

javascript
db.admins.insertOne({
  email: "admin@example.com",
  password: "$2a$10$examplehashedpassword", // Use bcrypt to hash your password
  createdAt: new Date()
})
Testing
The backend includes API endpoints that can be tested with tools like Postman or cURL. Refer to the API documentation below for endpoint details.

API Documentation
Base URL
http://localhost:5000/api

Authentication
All endpoints (except login/register) require a valid JWT token in the Authorization header:

text
Authorization: Bearer <token>
Endpoints
Users
POST /users/register - Register a new user

POST /users/login - Authenticate user

GET /users/profile - Get user profile (protected)

PUT /users/profile - Update user profile (protected)

Products
GET /products - Get all products

GET /products/:id - Get product by ID

POST /admin/products - Create new product (admin)

PUT /admin/products/:id - Update product (admin)

DELETE /admin/products/:id - Delete product (admin)

Cart
GET /cart - Get user's cart (protected)

POST /cart - Add item to cart (protected)

PUT /cart/:itemId - Update cart item (protected)

DELETE /cart/:itemId - Remove item from cart (protected)

Orders
POST /orders - Create new order (protected)

GET /orders - Get user's orders (protected)

GET /orders/:id - Get order by ID (protected)

PUT /orders/:id/pay - Update order to paid (protected)

PUT /admin/orders/:id - Update order status (admin)

GET /admin/orders - Get all orders (admin)

Payments
POST /payments - Process payment (protected)

Admin
POST /admin/login - Authenticate admin

GET /admin/customers - Get all customers (admin)

GET /admin/customers/:id - Get customer by ID (admin)

Deployment
For production deployment:

Set up a MongoDB Atlas cluster or other cloud MongoDB service.

Update the MONGO_URI in the .env file.

Configure a real email service (SendGrid, Mailgun, etc.) in emailService.js.

Set up proper file storage (AWS S3, Google Cloud Storage, etc.) for design uploads.

Use a process manager like PM2 to run the Node.js server in production.

Configure HTTPS with a valid SSL certificate.

Consider using a frontend framework like React or Vue.js for a more robust frontend.

License
This project is licensed under the MIT License.

text

## Step 5: Running the Application

1. Start MongoDB (make sure it's running locally or update the connection string)
2. Start the backend server:
```bash
cd backend
npm start
Open the frontend/index.html file in a browser