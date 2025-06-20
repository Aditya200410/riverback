const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Manager = require('../models/Manager');
const { upload } = require('../middleware/upload');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate, validationRules } = require('../middleware/validator');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/manager-users';
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
    const existingUser = await Manager.findOne({
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

    // Generate unique managerId
    const managerId = `MN${uuidv4()}`;

    // Create new user in database
    const user = new Manager({
      managerId,
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
      { userId: user._id, role: 'manager' },
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
          managerId: user.managerId,
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
    const user = await Manager.findOne({ mobile, phase });
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
          managerId: user.managerId,
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

// Update manager user by ID
router.put('/update/:id', auth, async (req, res) => {
  try {
    const user = await Manager.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { name, mobile, aadhar, address, phase } = req.body;
    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    if (aadhar) user.aadhar = aadhar;
    if (address) user.address = address;
    if (phase) user.phase = phase;
    await user.save();
    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete (anonymize) manager user by ID
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const user = await Manager.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.name = 'deleted';
    user.status = 'deleted';
    await user.save();
    res.json({ success: true, message: 'User anonymized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 