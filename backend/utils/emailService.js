const nodemailer = require('nodemailer');

// Global transporter configured for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail service directly
  auth: {
    user: process.env.EMAIL_USERNAME, // Your Gmail address
    pass: process.env.EMAIL_PASSWORD  // App password (not your real password)
  }
});

const sendEmail = async (options) => {
  const mailOptions = {
    from: 'T-Shirt Customization <no-reply@tshirtcustom.com>', // You can set display name but Gmail will show your actual email too
    to: options.email,
    subject: options.subject,
    text: options.message || '',
    html: options.html || ''
  };

  const info = await transporter.sendMail(mailOptions);

  console.log(`✅ Email sent to ${options.email}: ${info.messageId}`);
};

const sendOrderConfirmationEmail = async (user, order) => {
  const subject = `🛍️ Order Confirmation - Your Order #${order.orderId} is Confirmed!`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
      <h1 style="color: #4e73df;">Thank You for Your Purchase, ${user.name || 'Valued Customer'}!</h1>
      
      <p style="font-size: 16px;">We’ve successfully received your order <strong>#${order.orderId}</strong>. Our team is preparing everything for you!</p>
      
      <hr style="border: none; border-top: 1px solid #eee;">

      <h2 style="color: #333;">📝 Order Summary</h2>
      <ul style="padding-left: 20px; font-size: 15px;">
        ${order.items.map(item => `
          <li style="margin-bottom: 8px;">
            <strong>${item.quantity}x</strong> ${item.size} ${item.color} T-Shirt
            ${item.customText ? `<br><em>Custom Text:</em> "${item.customText}"` : ''}
            <br>Price: $${(item.priceAtPurchase * item.quantity).toFixed(2)}
          </li>
        `).join('')}
      </ul>

      <h2 style="color: #333;">🚚 Shipping To:</h2>
      <p style="font-size: 15px;">
        ${order.shippingDetails.name}<br>
        ${order.shippingDetails.street}<br>
        ${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.zip}<br>
        ${order.shippingDetails.country}
      </p>

      <h2 style="color: #333;">💳 Total Amount:</h2>
      <p style="font-size: 16px; font-weight: bold;">$${order.totalAmount.toFixed(2)}</p>

      <hr style="border: none; border-top: 1px solid #eee;">

      <p style="font-size: 15px;">You will receive another email with tracking details once your order ships.</p>
      
      <p style="font-size: 15px;">Need help? Just reply to this email or contact our support anytime.</p>

      <p style="font-size: 15px;">Thank you for choosing <strong>T-Shirt Customization</strong> – Where your style comes to life! 🎨👕</p>
      
      <footer style="font-size: 13px; color: #888; margin-top: 30px;">
        &copy; ${new Date().getFullYear()} T-Shirt Customization. All rights reserved.
      </footer>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject,
    html: message
  });
};


module.exports = { sendEmail, sendOrderConfirmationEmail };
