const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://wakilisrakabir:Z8e8x61R0J3qV0wO@cluster0.akjgjeg.mongodb.net/kitchenhood').then(async () => {
  const admin = await User.findOne({email: 'admin@kitchenhood.com'});
  console.log('Admin:', admin);
  process.exit();
}).catch(console.error);
