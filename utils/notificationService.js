const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = async (to, subject, text, html) => {
  if (!to) return; // Don't send if no email provided

  try {
    const transporter = createTransporter();
    
    // Check if SMTP_USER is configured
    if (!process.env.SMTP_USER) {
      console.warn('SMTP_USER is not configured. Email not sent.');
      return;
    }

    const mailOptions = {
      from: `"KitchenHood" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

const getAdminEmail = () => process.env.ADMIN_EMAIL || process.env.SMTP_USER;

// Specific notification functions
const sendOrderNotification = async (order, userEmail) => {
  const adminEmail = getAdminEmail();
  const orderId = order._id;
  const amount = order.totalAmount;
  
  // To Admin
  await sendMail(
    adminEmail,
    `New Order Received: #${orderId}`,
    `A new order has been placed.\nOrder ID: ${orderId}\nTotal Amount: ৳${amount}\nPayment Method: ${order.paymentMethod}`,
    `<h3>New Order Received</h3>
     <p><strong>Order ID:</strong> ${orderId}</p>
     <p><strong>Total Amount:</strong> ৳${amount}</p>
     <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>`
  );

  // To User (if email is available)
  if (userEmail) {
    await sendMail(
      userEmail,
      `Order Confirmation: #${orderId}`,
      `Thank you for your order!\nOrder ID: ${orderId}\nTotal Amount: ৳${amount}\nPayment Method: ${order.paymentMethod}`,
      `<h3>Order Confirmation</h3>
       <p>Thank you for shopping with KitchenHood!</p>
       <p><strong>Order ID:</strong> ${orderId}</p>
       <p><strong>Total Amount:</strong> ৳${amount}</p>
       <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
       <p>We will process your order soon.</p>`
    );
  }
};

const sendBookingNotification = async (booking, userEmail) => {
  const adminEmail = getAdminEmail();
  const bookingId = booking._id;
  
  // To Admin
  await sendMail(
    adminEmail,
    `New Service Booking: #${bookingId}`,
    `A new service has been booked.\nService: ${booking.serviceName}\nCustomer: ${booking.customerName}\nPhone: ${booking.customerPhone}\nDate: ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'N/A'}`,
    `<h3>New Service Booking</h3>
     <p><strong>Booking ID:</strong> ${bookingId}</p>
     <p><strong>Service:</strong> ${booking.serviceName}</p>
     <p><strong>Customer:</strong> ${booking.customerName}</p>
     <p><strong>Phone:</strong> ${booking.customerPhone}</p>
     <p><strong>Preferred Date:</strong> ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'N/A'}</p>`
  );

  // To User (if email is available)
  if (userEmail) {
    await sendMail(
      userEmail,
      `Booking Confirmation: #${bookingId}`,
      `Your service booking has been received.\nService: ${booking.serviceName}\nWe will contact you shortly.`,
      `<h3>Booking Confirmation</h3>
       <p>Thank you for choosing KitchenHood.</p>
       <p><strong>Service Booked:</strong> ${booking.serviceName}</p>
       <p><strong>Preferred Date:</strong> ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'N/A'}</p>
       <p>Our team will contact you shortly to confirm the appointment.</p>`
    );
  }
};

const sendMessageNotification = async (contactMsg) => {
  const adminEmail = getAdminEmail();
  const userEmail = contactMsg.email;
  
  // To Admin
  await sendMail(
    adminEmail,
    `New Contact Message from ${contactMsg.name}`,
    `Name: ${contactMsg.name}\nEmail: ${contactMsg.email}\nPhone: ${contactMsg.phone}\nMessage: ${contactMsg.message}`,
    `<h3>New Message Received</h3>
     <p><strong>Name:</strong> ${contactMsg.name}</p>
     <p><strong>Email:</strong> ${contactMsg.email}</p>
     <p><strong>Phone:</strong> ${contactMsg.phone}</p>
     <p><strong>Message:</strong></p>
     <p>${contactMsg.message}</p>`
  );

  // To User (Auto-reply)
  if (userEmail) {
    await sendMail(
      userEmail,
      `Thank you for contacting KitchenHood`,
      `Hi ${contactMsg.name},\nWe have received your message and will get back to you shortly.\n\nYour Message: ${contactMsg.message}`,
      `<h3>Thank you for reaching out!</h3>
       <p>Hi ${contactMsg.name},</p>
       <p>We have received your message and our team will get back to you as soon as possible.</p>
       <br/>
       <p><strong>Your Message:</strong></p>
       <p><em>${contactMsg.message}</em></p>`
    );
  }
};

module.exports = {
  sendMail,
  sendOrderNotification,
  sendBookingNotification,
  sendMessageNotification
};
