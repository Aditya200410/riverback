const mongoose = require('mongoose');

const moneyHandleSchema = new mongoose.Schema({
  moneytaker: {
    type: String,
    required: true,
    enum: ['manager', 'vendor']
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['pay', 'take']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MoneyHandle', moneyHandleSchema); 