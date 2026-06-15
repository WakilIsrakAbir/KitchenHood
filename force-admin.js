require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const adminExists = await User.findOne({ email: 'admin@kitchenhood.com' });
  if (!adminExists) {
    await User.create({
      name: 'Admin',
      email: 'admin@kitchenhood.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin created successfully.');
  } else {
    
    adminExists.password = 'admin123';
    await adminExists.save();
    console.log('Admin already existed. Password reset to admin123.');
  }
  process.exit();
}).catch(console.error);
