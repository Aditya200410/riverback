const mongoose = require('mongoose');

const sikariSchema = new mongoose.Schema({
  profilePhoto: {
    type: String,
    required: false
  },
  bannerPhoto: {
    type: String,
    required: false
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
  workAddress: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  homeAddress: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  dateOfJoining: {
    type: Date,
    required: false
  },
  smargId: {
    type: String,
    required: false,
    unique: true
  },
  adharCardNumber: {
    type: String,
    required: false,
    unique: true
  },
  adharCardPhoto: {
    type: String,
    required: false
  },
  bankAccountNumber: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  ifscCode: {
    type: String,
    required: false
  },
  bankPassbookPhoto: {
    type: String,
    required: false
  },
  madhayamName: {
    type: String,
    required: false,
    trim: true
  },
  madhayamMobileNumber: {
    type: String,
    required: false
  },
  madhayamAddress: {
    type: String,
    required: false,
    trim: true
  },
  boatNumber: {
    type: String,
    required: false
  },
  boatId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  boatType: {
    type: String,
    required: false,
    enum: ['company boat', 'self boat']
  },
  position: {
    type: String,
    required: false,
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

sikariSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Duplicate key error'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Sikari', sikariSchema); 