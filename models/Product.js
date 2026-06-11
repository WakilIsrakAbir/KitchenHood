const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['chimney', 'hood', 'filter', 'accessory', 'part'],
    default: 'hood'
  },
  image: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    default: 0
  },
  specs: {
    type: Map,
    of: String,
    default: {}
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
