const mongoose = require('mongoose');

const sikariSchema = new mongoose.Schema({
  profilePhoto: {
    type: String,
    required: true
  },
  bannerPhoto: {
    type: String,
    required: true
  },
  sikariId: {
    type: String,
    required: true,
    unique: true
  },
  sikariName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  dateOfJoining: {
    type: Date,
    required: true
  },
  smargId: {
    type: String,
    required: true,
    unique: true
  },
  adharCardNumber: {
    type: String,
    required: true,
    unique: true
  },
  adharCardPhoto: {
    type: String,
    required: true
  },
  bankAccountNumber: {
    type: String,
    required: true,
    unique: true
  },
  ifscCode: {
    type: String,
    required: true
  },
  bankPassbookPhoto: {
    type: String,
    required: true
  },
  madhayamName: {
    type: String,
    required: true,
    trim: true
  },
  madhayamMobileNumber: {
    type: String,
    required: true
  },
  madhayamAddress: {
    type: String,
    required: true,
    trim: true
  },
  boatNumber: {
    type: String,
    required: true
  },
  boatId: {
    type: String,
    required: true,
    unique: true
  },
  boatType: {
    type: String,
    required: true,
    enum: ['company boat', 'self boat']
  },
  position: {
    type: String,
    required: true,
    enum: ['personal duty', 'government register fisherman', 'illegal']
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sikari', sikariSchema); 