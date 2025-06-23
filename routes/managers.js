const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const Manager = require('../models/Manager');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/manager-users';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'manager-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Get all managers
router.get('/', managerController.getAllManagers);

// Get manager by ID
router.get('/:id', managerController.getManagerById);

// Update manager
router.put('/:id', managerController.updateManager);

// Delete manager
router.delete('/:id', managerController.deleteManager);

// Get all signed-in managers
router.get('/signed-in', async (req, res) => {
  try {
    const signedInManagers = await Manager.find({
      status: 'active',
      isSignedIn: true
    }).select('-password');

    res.json({
      success: true,
      data: signedInManagers.map(manager => ({
        id: manager._id,
        name: manager.name,
        email: manager.email,
        mobile: manager.mobile,
        location: manager.location,
        signInTime: manager.signInTime,
        lastActive: manager.lastActive
      }))
    });
  } catch (err) {
    console.error('Error fetching signed-in managers:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching signed-in managers'
      }
    });
  }
});

// Add manager route (similar to sikari add)
router.post('/add', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 },
  { name: 'adharCardPhoto', maxCount: 1 },
  { name: 'bankPassbookPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received manager add request with body:', req.body);
    console.log('Received files:', req.files);
    
    const {
      managerId,
      managerName,
      mobileNumber,
      location,
      dateOfJoining,
      smargId,
      adharCardNumber,
      bankAccountNumber,
      ifscCode,
      madhayamName,
      madhayamMobileNumber,
      madhayamAddress,
      boatNumber,
      boatId,
      boatType,
      position,
      email,
      address,
      phase
    } = req.body;

    // Validate required fields
    const requiredFields = ['managerId', 'managerName', 'mobileNumber', 'location', 'smargId', 'adharCardNumber'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: `Missing required fields: ${missingFields.join(', ')}`
        }
      });
    }

    // Validate boat type if provided
    if (boatType && !['company boat', 'self boat'].includes(boatType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BOAT_TYPE',
          message: 'Boat type must be either "company boat" or "self boat"'
        }
      });
    }

    // Validate position if provided
    if (position && !['personal duty', 'government register fisherman', 'illegal'].includes(position)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_POSITION',
          message: 'Position must be one of: personal duty, government register fisherman, illegal'
        }
      });
    }

    // Check for duplicate mobileNumber, managerId, smargId, adharCardNumber
    const duplicate = await Manager.findOne({
      $or: [
        { mobile: mobileNumber },
        { managerId: managerId },
        { aadhar: adharCardNumber }
      ]
    });
    
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: 'A manager with the same mobile number, manager ID, or adhar card number already exists.'
        }
      });
    }

    // Create manager with hashed password
    const salt = await require('bcryptjs').genSalt(10);
    const hashedPassword = await require('bcryptjs').hash('defaultPassword123', salt);

    const manager = new Manager({
      managerId,
      name: managerName,
      mobile: mobileNumber,
      email: email || undefined,
      aadhar: adharCardNumber,
      password: hashedPassword,
      address: address || madhayamAddress,
      profilePicture: req.files?.profilePhoto?.[0]?.filename,
      phase,
      location,
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
      smargId,
      bankAccountNumber,
      ifscCode,
      madhayamName,
      madhayamMobileNumber,
      madhayamAddress,
      boatNumber,
      boatId,
      boatType,
      position,
      bannerPhoto: req.files?.bannerPhoto?.[0]?.filename,
      adharCardPhoto: req.files?.adharCardPhoto?.[0]?.filename,
      bankPassbookPhoto: req.files?.bankPassbookPhoto?.[0]?.filename,
      isVerified: true,
      status: 'active'
    });

    await manager.save();

    const baseUrl = req.protocol + '://' + req.get('host');
    res.status(201).json({
      success: true,
      message: 'Manager added successfully',
      data: {
        id: manager._id,
        managerId: manager.managerId,
        managerName: manager.name,
        mobileNumber: manager.mobile,
        location: manager.location,
        dateOfJoining: manager.dateOfJoining,
        smargId: manager.smargId,
        adharCardNumber: manager.aadhar,
        bankAccountNumber: manager.bankAccountNumber,
        ifscCode: manager.ifscCode,
        madhayamName: manager.madhayamName,
        madhayamMobileNumber: manager.madhayamMobileNumber,
        madhayamAddress: manager.madhayamAddress,
        boatNumber: manager.boatNumber,
        boatId: manager.boatId,
        boatType: manager.boatType,
        position: manager.position,
        email: manager.email,
        address: manager.address,
        phase: manager.phase,
        profilePhoto: manager.profilePicture ? `${baseUrl}/uploads/manager-users/${manager.profilePicture}` : null,
        bannerPhoto: manager.bannerPhoto ? `${baseUrl}/uploads/manager-users/${manager.bannerPhoto}` : null,
        adharCardPhoto: manager.adharCardPhoto ? `${baseUrl}/uploads/manager-users/${manager.adharCardPhoto}` : null,
        bankPassbookPhoto: manager.bankPassbookPhoto ? `${baseUrl}/uploads/manager-users/${manager.bankPassbookPhoto}` : null
      }
    });
  } catch (err) {
    console.error('Error adding manager:', err);
    // Clean up uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          const filePath = path.join('uploads/manager-users', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed: ' + validationErrors.join(', ')
        }
      });
    }
    
    // Handle duplicate field errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: `A manager with this ${field} already exists`
        }
      });
    }
    
    // Handle other specific errors
    if (err.message) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Error adding manager: ' + err.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding manager'
      }
    });
  }
});

module.exports = router; 