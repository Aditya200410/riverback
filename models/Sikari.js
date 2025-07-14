const mongoose = require('mongoose');

const sikariSchema = new mongoose.Schema({
  profilePhoto: {
    type: String
  },
  bannerPhoto: {
    type: String
  },
  sikariId: {
    type: String
  },
  sikariName: {
    type: String,
    trim: true
  },
  mobile: {
    type: String
  },
  workAddress: {
    type: String,
    trim: true,
    default: ''
  },
  homeAddress: {
    type: String,
    trim: true,
    default: ''
  },
  dateOfJoining: {
    type: Date
  },
  smargId: {
    type: String
  },
  adharCardNumber: {
    type: String
  },
  adharCardPhoto: {
    type: String
  },
  bankAccountNumber: {
    type: String
  },
  ifscCode: {
    type: String
  },
  bankPassbookPhoto: {
    type: String
  },
  madhayamName: {
    type: String,
    trim: true
  },
  madhayamMobileNumber: {
    type: String
  },
  madhayamAddress: {
    type: String,
    trim: true
  },
  boatNumber: {
    type: String
  },
  boatId: {
    type: String
  },
  boatType: {
    type: String
  },
  position: {
    type: String
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