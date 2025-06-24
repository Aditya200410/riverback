const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companyUserSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 10,
    maxlength: 10
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  companyAddress: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  aadhar_no: {
    type: String,
    required: false,
    unique: true
  },
  profilePicture: {
    type: String,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
companyUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
companyUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('CompanyUser', companyUserSchema); 