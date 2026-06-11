const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    const adminExists = await User.findOne({ email: 'admin@kitchenhood.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@kitchenhood.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      });
      console.log('Admin user created: admin@kitchenhood.com / admin123');
    } else {
      console.log('Admin user already exists.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
