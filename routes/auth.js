// Improved Express Auth Routes with better structure, security, and async handling
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const CompanyUser = require('../models/CompanyUser');
const {
    sendOTP,
    verifyOTP,
    signup,
    login,
    getProfilePicture
} = require('../controllers/authController');
const { upload } = require('../middleware/upload');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');
const validatePassword = require('../middleware/passwordValidation');
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

// Validate Token
router.get('/validate-token', auth, async (req, res) => {
  try {
    const user = await CompanyUser.findById(req.user.id).select('-password');
    if (!user) return res.status(401).json({ 
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Invalid user'
      }
    });

    res.json({ 
      success: true,
      data: { user }
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

// Send OTP
router.post('/send-otp', otpLimiter, validationRules.sendOTP, validate, sendOTP);

// Verify OTP
router.post('/verify-otp', validationRules.verifyOTP, validate, async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await CompanyUser.findOne({ mobile });
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

    // Generate JWT token after successful verification
    const token = jwt.sign(
      { 
        id: user._id,
        role: 'company',
        mobile: user.mobile
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          hasProfilePicture: !!user.profilePicture
        }
      }
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

// Signup
router.post('/signup', upload.single('profilePicture'), validationRules.companySignup, validate, async (req, res) => {
  try {
    const { name, mobile, password, email, companyName, companyAddress } = req.body;

    // Check if user exists
    const existingUser = await CompanyUser.findOne({ mobile });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User already exists'
        }
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user with OTP
    const newUser = new CompanyUser({
      name,
      mobile,
      password,
      email,
      companyName,
      companyAddress,
      otp,
      otpExpiry,
      profilePicture: req.file ? req.file.filename : undefined
    });

    await newUser.save();

    // TODO: Integrate with SMS service to send OTP
    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'OTP sent successfully. Please verify your mobile number.',
      data: {
        mobile,
        otpExpiry
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

// Login
router.post('/login', loginLimiter, validationRules.login, validate, async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Find user
    const user = await CompanyUser.findOne({ mobile });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials'
        }
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNVERIFIED_USER',
          message: 'Please verify your mobile number first'
        }
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials'
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: 'company',
        mobile: user.mobile
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          hasProfilePicture: !!user.profilePicture
        }
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error logging in'
      }
    });
  }
});

// Get Profile Picture
router.get('/profile-picture/:id', getProfilePicture);

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { mobile } = req.body;
  try {
    const user = await CompanyUser.findOne({ mobile });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
      // Send SMS here with resetToken (not shown)
    }
    return res.json({ 
      success: true,
      message: 'If company exists, reset link sent'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error sending reset link'
      }
    });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) return res.status(400).json({ 
    success: false,
    error: {
      code: 'PASSWORD_REQUIRED',
      message: 'New password required'
    }
  });

  try {
    const users = await CompanyUser.find({ resetPasswordExpires: { $gt: Date.now() } });
    let matchedUser = null;
    for (let user of users) {
      if (await bcrypt.compare(token, user.resetPasswordToken || '')) {
        matchedUser = user;
        break;
      }
    }
    if (!matchedUser) return res.status(400).json({ 
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });

    matchedUser.password = password;
    matchedUser.resetPasswordToken = undefined;
    matchedUser.resetPasswordExpires = undefined;
    await matchedUser.save();

    return res.json({ 
      success: true,
      message: 'Password reset successful'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error resetting password'
      }
    });
  }
});

// Update Profile
router.put('/update-profile', auth, async (req, res) => {
  const { name, email, companyName, companyAddress } = req.body;
  try {
    const user = await CompanyUser.findById(req.user.id);
    if (!user) return res.status(404).json({ 
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Company not found'
      }
    });

    if (name) user.name = name;
    if (email) user.email = email;
    if (companyName) user.companyName = companyName;
    if (companyAddress) user.companyAddress = companyAddress;
    
    await user.save();

    return res.json({ 
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: { 
          id: user._id, 
          name: user.name,
          email: user.email,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          mobile: user.mobile,
          hasProfilePicture: !!user.profilePicture
        }
      }
    });
  } catch (err) {
    console.error(err);
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