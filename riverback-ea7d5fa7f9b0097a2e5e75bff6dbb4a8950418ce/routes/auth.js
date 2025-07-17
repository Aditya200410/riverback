// Improved Express Auth Routes with better structure, security, and async handling
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const CompanyUser = require('../models/CompanyUser');
const { upload } = require('../middleware/upload');
const { loginLimiter } = require('../middleware/rateLimiter');
const validatePassword = require('../middleware/passwordValidation');
const { validate, validationRules } = require('../middleware/validator');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { generateCompanyId } = require('../utils/idGenerator');
const { generateFileUrl } = require('../utils/urlGenerator');

// Middleware to protect routes
const auth = async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'NO_USER_ID',
        message: 'No user ID provided, authorization denied'
      }
    });
  }
  try {
    const user = await CompanyUser.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'Invalid user'
        }
      });
    }
    req.user = { id: user._id, role: 'company' };
    next();
  } catch {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_USER',
        message: 'Invalid user'
      }
    });
  }
};

// Validate User
router.get('/validate-user', auth, async (req, res) => {
  try {
    const user = await CompanyUser.findById(req.user.id).select('-password');
    if (!user) return res.status(401).json({ 
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Invalid user'
      }
    });

    // Create a user object with the proper profile picture URL
    const userWithUrl = {
      ...user.toObject(),
      profilePicture: generateFileUrl(req, user.profilePicture)
    };

    res.json({ 
      success: true,
      data: { user: userWithUrl }
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
const uploadDir = 'uploads/company-users';
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
      email,
      companyName,
      companyAddress,
      aadhar_no
    } = req.body;

    // Check if user already exists in database
    const existingUser = await CompanyUser.findOne({
      $or: [
        { mobile },
        { email },
        { aadhar_no }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this mobile, email or aadhar number already exists'
        }
      });
    }

    // Generate unique companyId using the ID generator
    let companyId;
    try {
      companyId = await generateCompanyId();
    } catch (idError) {
      console.error('Error generating company ID:', idError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ID_GENERATION_ERROR',
          message: 'Failed to generate unique company ID. Please try again.'
        }
      });
    }

    // Create new user in database
    const user = new CompanyUser({
      companyId,
      name,
      mobile,
      password,
      email,
      companyName,
      companyAddress,
      aadhar_no,
      profilePicture: req.file ? req.file.path : undefined,
      isVerified: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          companyId: user.companyId,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          aadhar_no: user.aadhar_no,
          profilePicture: generateFileUrl(req, user.profilePicture),
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          role: 'company'
        }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user. Please try again.'
      }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Find user
    const user = await CompanyUser.findOne({ mobile });
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          companyId: user.companyId,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          aadhar_no: user.aadhar_no,
          profilePicture: generateFileUrl(req, user.profilePicture),
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
    const user = await CompanyUser.findById(req.params.id);
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
router.put('/update-profile', async (req, res) => {
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