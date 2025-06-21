const mongoose = require('mongoose');

const moneyHandleSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['pay', 'take']
  },
  toWhom: {
    type: String,
    required: true,
    trim: true
  },
  sendTo: {
    type: String,
    required: true,
    enum: ['Company', 'Manager', 'Sikari', 'Security'],
    trim: true
  },
  receiverName: {
    type: String,
    required: true,
    trim: true
  },
  receiverId: {
    type: String,
    required: false,
    trim: true
  },
  pay: {
    type: Boolean,
    default: false
  },
  received: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create index for faster queries
moneyHandleSchema.index({ companyId: 1, status: 1 });
moneyHandleSchema.index({ date: -1 });
moneyHandleSchema.index({ toWhom: 1 });
moneyHandleSchema.index({ sendTo: 1 });
moneyHandleSchema.index({ receiverName: 1 });

module.exports = mongoose.model('MoneyHandle', moneyHandleSchema); 