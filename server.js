const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

connectDB();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/chat', require('./routes/chat'));

const { protect: protectMiddleware, adminOnly: adminMiddleware } = require('./middleware/auth');

app.get('/api/admin/stats', protectMiddleware, adminMiddleware, async (req, res) => {
  try {
    const User = require('./models/User');
    const Order = require('./models/Order');
    const Booking = require('./models/Booking');
    
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    const orders = await Order.find({ orderStatus: { $ne: 'cancelled' } });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      totalUsers,
      totalOrders,
      totalBookings,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/seed', async (req, res) => {
  try {
    const Service = require('./models/Service');
    const Product = require('./models/Product');
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');

    const adminExists = await User.findOne({ email: 'admin@kitchenhood.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@kitchenhood.com',
        password: 'admin123',
        role: 'admin'
      });
    }

    // Fix any existing services missing the isAvailable field
    await Service.updateMany({ isAvailable: { $exists: false } }, { $set: { isAvailable: true } });

    const existingServices = await Service.countDocuments();
    if (existingServices === 0) {
      await Service.insertMany([
        {
          name: 'Kitchen Hood Deep Cleaning',
          description: 'Complete deep cleaning of your kitchen hood including filters, fan, and exterior. We use eco-friendly cleaning solutions to remove all grease and grime.',
          price: 1500,
          category: 'cleaning',
          estimatedTime: '2-3 hours',
          features: ['Filter cleaning', 'Fan blade cleaning', 'Exterior polishing', 'Grease trap cleaning', 'Eco-friendly chemicals']
        },
        {
          name: 'Kitchen Hood Repair',
          description: 'Expert repair service for all types of kitchen hoods. We fix motor issues, fan problems, lighting, and control panel malfunctions.',
          price: 2000,
          category: 'repair',
          estimatedTime: '1-2 hours',
          features: ['Motor repair/replacement', 'Fan repair', 'Light replacement', 'Control panel fix', 'Wiring check']
        },
        {
          name: 'Kitchen Hood Installation',
          description: 'Professional installation service for new kitchen hoods. We ensure proper mounting, ducting, and electrical connections.',
          price: 3000,
          category: 'installation',
          estimatedTime: '3-4 hours',
          features: ['Wall mounting', 'Duct installation', 'Electrical connection', 'Testing & demo', '1 year warranty']
        },
        {
          name: 'Filter Replacement',
          description: 'Replace old, clogged filters with new high-quality ones. We carry filters for all major brands.',
          price: 800,
          category: 'maintenance',
          estimatedTime: '30 min',
          features: ['Filter removal', 'Size measurement', 'New filter installation', 'Old filter disposal', 'Brand compatibility']
        },
        {
          name: 'Emergency Repair Service',
          description: 'Urgent repair service for kitchen hood emergencies. Same-day service available in Dhaka city.',
          price: 3500,
          category: 'repair',
          estimatedTime: '1-2 hours',
          features: ['Same day service', 'Priority dispatch', 'Full diagnostic', 'Temporary fix if needed', '24/7 support']
        },
        {
          name: 'Annual Maintenance Contract',
          description: 'Yearly maintenance contract for your kitchen hood. Includes quarterly cleaning and priority repair service.',
          price: 5000,
          category: 'maintenance',
          estimatedTime: 'Yearly contract',
          features: ['Quarterly cleaning', 'Priority service', 'Free inspection', '10% discount on repairs', 'Free filter replacement']
        }
      ]);
    }

    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
      await Product.insertMany([
        {
          name: 'Elica 60cm Auto Clean Chimney',
          description: 'Elica 60cm auto clean chimney with motion sensor, 1200 m3/h suction capacity',
          price: 18500,
          category: 'chimney',
          stock: 15,
          specs: { brand: 'Elica', size: '60cm', suction: '1200 m3/h', type: 'Auto Clean', filter: 'Baffle Filter' }
        },
        {
          name: 'Faber 90cm Kitchen Hood',
          description: 'Faber 90cm chimney with touch control, LED display, 1000 m3/h suction',
          price: 22000,
          category: 'hood',
          stock: 10,
          specs: { brand: 'Faber', size: '90cm', suction: '1000 m3/h', type: 'Touch Control', filter: 'Aluminum Filter' }
        },
        {
          name: 'Kutchina 60cm Filterless Chimney',
          description: 'Kutchina 60cm filterless chimney with auto clean technology, 1100 m3/h',
          price: 16500,
          category: 'chimney',
          stock: 20,
          specs: { brand: 'Kutchina', size: '60cm', suction: '1100 m3/h', type: 'Filterless', filter: 'Oil Collector' }
        },
        {
          name: 'Baffle Filter Set (2 pcs)',
          description: 'Stainless steel baffle filter set compatible with most kitchen hood brands',
          price: 1200,
          category: 'filter',
          stock: 50,
          specs: { material: 'Stainless Steel', quantity: '2 pcs', compatibility: 'Universal', type: 'Baffle Filter' }
        },
        {
          name: 'Activated Carbon Filter',
          description: 'Activated carbon filter for recirculating kitchen hoods. Removes odors effectively.',
          price: 600,
          category: 'filter',
          stock: 100,
          specs: { material: 'Activated Carbon', quantity: '1 pc', compatibility: 'Recirculating Hoods', type: 'Carbon Filter' }
        },
        {
          name: 'Kitchen Hood Motor (Universal)',
          description: 'Universal replacement motor for kitchen hoods. Fits most brands with adjustable mounting.',
          price: 2500,
          category: 'part',
          stock: 25,
          specs: { voltage: '220V', power: '150W', type: 'Universal', brand: 'Compatible' }
        }
      ]);
    }

    res.json({ message: 'Seed data created successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins their own room using their userId as conversationId
  socket.on('join-room', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room: ${conversationId}`);
  });

  // Legacy support for old 'join-chat' event
  socket.on('join-chat', (conversationId) => {
    socket.join(conversationId);
  });

  // Handle message from user or admin
  socket.on('send-message', async (data) => {
    try {
      const Message = require('./models/Message');
      const msgDoc = await Message.create({
        sender: data.senderId || null,
        senderName: data.senderName || 'User',
        senderRole: data.senderRole || 'user',
        message: data.message,
        conversationId: data.conversationId
      });
      // Broadcast to everyone in the room (both user and admin)
      io.to(data.conversationId).emit('new-message', {
        _id: msgDoc._id,
        senderName: msgDoc.senderName,
        senderRole: msgDoc.senderRole,
        message: msgDoc.message,
        conversationId: msgDoc.conversationId,
        createdAt: msgDoc.createdAt
      });
      // Notify admin panel of new conversation activity
      io.emit('conversation-update', { conversationId: data.conversationId, senderName: data.senderName });
    } catch (error) {
      console.error('Chat error:', error.message);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Static HTML routing
app.get(['/services.html', '/products.html', '/contact.html', '/about.html', '/login.html', '/register.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

// SPA Dashboards (Catch-all for their respective sub-paths)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/user/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user', 'dashboard.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
