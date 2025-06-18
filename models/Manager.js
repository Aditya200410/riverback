const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
  managerId: {
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
  aadhar: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 12,
    maxlength: 12
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String
  },
  phase: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Hash password before saving
managerSchema.pre('save', async function(next) {
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
managerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Manager', managerSchema); 