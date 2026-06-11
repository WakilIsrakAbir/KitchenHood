const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
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
    enum: ['repair', 'cleaning', 'installation', 'maintenance'],
    default: 'repair'
  },
  image: {
    type: String,
    default: ''
  },
  features: [String],
  estimatedTime: {
    type: String,
    default: '1-2 hours'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
