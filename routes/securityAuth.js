const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const SecurityUser = require('../models/SecurityUser');
const { upload } = require('../middleware/upload');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate, validationRules } = require('../middleware/validator');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

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
    const securityUser = await SecurityUser.findById(req.user.id).select('-password');
    if (!securityUser) return res.status(401).json({ 
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Invalid security user'
      }
    });

    res.json({ 
      success: true,
      data: { securityUser }
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

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/security-users';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
        }
      });

const uploadMulter = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
  }
});

// Signup - Direct user creation without OTP
router.post('/signup', uploadMulter.single('profilePicture'), async (req, res) => {
  try {
    const {
      name,
      mobile,
      password,
      aadhar,
      address,
      phase
    } = req.body;

    // Check if user already exists in database
    const existingUser = await SecurityUser.findOne({
      $or: [
        { mobile },
        { aadhar }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this mobile or aadhar number already exists'
        }
      });
    }

    // Generate securityId
    const count = await SecurityUser.countDocuments();
    const securityId = `SCU${(count + 1).toString().padStart(3, '0')}`;

    // Create new user in database
    const user = new SecurityUser({
      securityId,
      name,
      mobile,
      password,
      aadhar,
      address,
      phase,
      profilePicture: req.file ? req.file.path : undefined,
      isVerified: true
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: 'security' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          _id: user._id,
          securityId: user.securityId,
          name: user.name,
          mobile: user.mobile,
          aadhar: user.aadhar,
          address: user.address,
          phase: user.phase,
          profilePicture: user.profilePicture,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobile, password, phase } = req.body;

    // Find user with both mobile and phase
    const user = await SecurityUser.findOne({ mobile, phase });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid mobile number, phase or password'
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
          message: 'Invalid mobile number, phase or password'
        }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: 'security' },
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
          securityId: user.securityId,
          name: user.name,
          mobile: user.mobile,
          aadhar: user.aadhar,
          address: user.address,
          phase: user.phase,
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

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { mobile } = req.body;
  try {
    const securityUser = await SecurityUser.findOne({ mobile });
    if (securityUser) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      securityUser.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      securityUser.resetPasswordExpires = Date.now() + 3600000;
      await securityUser.save();
      // Send SMS here with resetToken (not shown)
    }
    return res.json({ 
      success: true,
      message: 'If security user exists, reset link sent'
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
    const securityUsers = await SecurityUser.find({ resetPasswordExpires: { $gt: Date.now() } });
    let matchedSecurityUser = null;
    for (let securityUser of securityUsers) {
      if (await bcrypt.compare(token, securityUser.resetPasswordToken || '')) {
        matchedSecurityUser = securityUser;
        break;
      }
    }
    if (!matchedSecurityUser) return res.status(400).json({ 
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });

    matchedSecurityUser.password = password;
    matchedSecurityUser.resetPasswordToken = undefined;
    matchedSecurityUser.resetPasswordExpires = undefined;
    await matchedSecurityUser.save();

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
  try {
    const { name, securityCompany } = req.body;
    const user = await SecurityUser.findById(req.user.id);
    
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
    if (securityCompany) user.securityCompany = securityCompany;

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
          securityCompany: user.securityCompany,
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

// Get Profile Picture
router.get('/profile-picture/:id', async (req, res) => {
  try {
    const user = await SecurityUser.findById(req.params.id);
    if (!user || !user.profilePicture) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_PICTURE_NOT_FOUND',
          message: 'Profile picture not found'
        }
      });
    }

    res.sendFile(path.join(__dirname, '..', user.profilePicture));
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

module.exports = router; 