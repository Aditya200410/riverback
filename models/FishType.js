const mongoose = require('mongoose');

const fishTypeSchema = new mongoose.Schema({
  fishName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FishType', fishTypeSchema); 