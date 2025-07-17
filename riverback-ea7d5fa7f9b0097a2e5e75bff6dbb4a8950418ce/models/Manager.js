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
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required:false,
    lowercase: true,
    sparse: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  aadhar: {
    type: String,
    required: false,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: false,
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
  resetPasswordExpires: Date,
  location: {
    type: String,
    trim: true
  },
  isSignedIn: {
    type: Boolean,
    default: false
  },
  signInTime: {
    type: Date
  },
  lastActive: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  // Additional fields for sikari-like structure
  dateOfJoining: {
    type: Date
  },
  smargId: {
    type: String,
    trim: true
  },
  bankAccountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  madhayamName: {
    type: String,
    trim: true
  },
  madhayamMobileNumber: {
    type: String,
    trim: true
  },
  madhayamAddress: {
    type: String,
    trim: true
  },
  boatNumber: {
    type: String,
    trim: true
  },
  boatId: {
    type: String,
    trim: true
  },
  boatType: {
    type: String,
    enum: ['company boat', 'self boat'],
    trim: true
  },
  position: {
    type: String,
    enum: ['personal duty', 'government register fisherman', 'illegal'],
    trim: true
  },
  bannerPhoto: {
    type: String
  },
  adharCardPhoto: {
    type: String
  },
  bankPassbookPhoto: {
    type: String
  },
  workarea: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  }
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