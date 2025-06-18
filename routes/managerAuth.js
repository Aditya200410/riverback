const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Manager = require('../models/Manager');
const { upload } = require('../middleware/upload');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { validate, validationRules } = require('../middleware/validator');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ 
    success: false,
    error: {
      code: 'NO_TOKEN',
      message: 'No token, authorization denied'
    }
  });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }
};

// Validate token
router.get('/validate-token', auth, async (req, res) => {
  try {
    const manager = await Manager.findById(req.user.id).select('-password');
    if (!manager) return res.status(401).json({ 
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Invalid manager'
      }
    });

    res.json({ 
      success: true,
      data: { manager }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Server error'
      }
    });
  }
});

// Signup
router.post('/signup', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, mobile, password, aadhar } = req.body;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user with OTP
    const newUser = new Manager({
      name,
      mobile,
      password,
      aadhar,
      otp,
      otpExpiry,
      profilePicture: req.file ? req.file.filename : undefined
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { userId: newUser._id, role: 'manager' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // TODO: Integrate with SMS service to send OTP
    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'OTP sent successfully. Please verify your mobile number.',
      data: {
        mobile,
        otpExpiry,
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          mobile: newUser.mobile,
          aadhar: newUser.aadhar,
          profilePicture: newUser.profilePicture,
          isVerified: newUser.isVerified,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error in signup process'
      }
    });
  }
});

// Verify OTP
router.post('/verify-otp', validationRules.verifyOTP, validate, async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await Manager.findOne({ mobile });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_NOT_REQUESTED',
          message: 'OTP not requested'
        }
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid OTP'
        }
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_EXPIRED',
          message: 'OTP has expired'
        }
      });
    }

    // Clear OTP and mark user as verified
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error verifying OTP'
      }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Find user
    const user = await Manager.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid mobile number or password'
        }
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid mobile number or password'
        }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: 'manager' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          aadhar: user.aadhar,
          profilePicture: user.profilePicture,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error in login process'
      }
    });
  }
});

// Get Profile Picture
router.get('/profile-picture/:id', async (req, res) => {
  try {
    const user = await Manager.findById(req.params.id);
    if (!user || !user.profilePicture) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_PICTURE_NOT_FOUND',
          message: 'Profile picture not found'
        }
      });
    }

    res.sendFile(path.join(__dirname, '..', 'uploads', user.profilePicture));
  } catch (error) {
    console.error('Error getting profile picture:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting profile picture'
      }
    });
  }
});

// Update Profile
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { name, companyId } = req.body;
    const user = await Manager.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (name) user.name = name;
    if (companyId) user.companyId = companyId;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          aadhar: user.aadhar,
          companyId: user.companyId,
          hasProfilePicture: !!user.profilePicture
        }
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error updating profile'
      }
    });
  }
});

module.exports = router; 