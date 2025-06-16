const mongoose = require('mongoose');

const madhayamSchema = new mongoose.Schema({
  madhayamId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  madhayamName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    }
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
  adharCardNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{12}$/.test(v);
      },
      message: props => `${props.value} is not a valid Aadhar number!`
    }
  },
  bankAccountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ifscCode: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid IFSC code!`
    }
  },
  profilePhoto: {
    type: String,
    required: true
  },
  bannerPhoto: {
    type: String,
    required: true
  },
  adharCardPhoto: {
    type: String,
    required: true
  },
  bankPassbookPhoto: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
madhayamSchema.index({ madhayamId: 1 });
madhayamSchema.index({ mobileNumber: 1 });
madhayamSchema.index({ adharCardNumber: 1 });
madhayamSchema.index({ bankAccountNumber: 1 });
madhayamSchema.index({ status: 1 });

const Madhayam = mongoose.model('Madhayam', madhayamSchema);

module.exports = Madhayam; 