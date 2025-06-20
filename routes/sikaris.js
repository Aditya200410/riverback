const express = require('express');
const router = express.Router();
const sikariController = require('../controllers/sikariController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/sikaris';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sikari-' + uniqueSuffix + path.extname(file.originalname));
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

// Routes
router.get('/', async (req, res) => {
  try {
    const sikaris = await sikariController.getAllSikaris();
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: sikaris.map(sikari => ({
        id: sikari._id,
        sikariId: sikari.sikariId,
        sikariName: sikari.sikariName,
        mobileNumber: sikari.mobileNumber,
        location: sikari.location,
        dateOfJoining: sikari.dateOfJoining,
        smargId: sikari.smargId,
        adharCardNumber: sikari.adharCardNumber,
        bankAccountNumber: sikari.bankAccountNumber,
        ifscCode: sikari.ifscCode,
        madhayamName: sikari.madhayamName,
        madhayamMobileNumber: sikari.madhayamMobileNumber,
        madhayamAddress: sikari.madhayamAddress,
        boatNumber: sikari.boatNumber,
        boatId: sikari.boatId,
        boatType: sikari.boatType,
        position: sikari.position,
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null,
        adharCardPhoto: sikari.adharCardPhoto ? `${baseUrl}/uploads/sikaris/${sikari.adharCardPhoto}` : null,
        bankPassbookPhoto: sikari.bankPassbookPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bankPassbookPhoto}` : null
      }))
    });
  } catch (err) {
    console.error('Error fetching sikaris:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching sikaris'
      }
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sikari = await sikariController.getSikariById(req.params.id);
    if (!sikari) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SIKARI_NOT_FOUND',
          message: 'Sikari not found'
        }
      });
    }
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: {
        id: sikari._id,
        sikariId: sikari.sikariId,
        sikariName: sikari.sikariName,
        mobileNumber: sikari.mobileNumber,
        location: sikari.location,
        dateOfJoining: sikari.dateOfJoining,
        smargId: sikari.smargId,
        adharCardNumber: sikari.adharCardNumber,
        bankAccountNumber: sikari.bankAccountNumber,
        ifscCode: sikari.ifscCode,
        madhayamName: sikari.madhayamName,
        madhayamMobileNumber: sikari.madhayamMobileNumber,
        madhayamAddress: sikari.madhayamAddress,
        boatNumber: sikari.boatNumber,
        boatId: sikari.boatId,
        boatType: sikari.boatType,
        position: sikari.position,
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null,
        adharCardPhoto: sikari.adharCardPhoto ? `${baseUrl}/uploads/sikaris/${sikari.adharCardPhoto}` : null,
        bankPassbookPhoto: sikari.bankPassbookPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bankPassbookPhoto}` : null
      }
    });
  } catch (err) {
    console.error('Error fetching sikari details:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching sikari details'
      }
    });
  }
});

router.post('/add', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 },
  { name: 'adharCardPhoto', maxCount: 1 },
  { name: 'bankPassbookPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received sikari add request with body:', req.body);
    console.log('Received files:', req.files);
    
    const {
      sikariId,
      sikariName,
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
      position
    } = req.body;

    // Validate required fields
    const requiredFields = ['sikariId', 'sikariName', 'mobileNumber', 'location', 'smargId', 'adharCardNumber'];
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

    // Only check for duplicate mobileNumber, sikariId, smargId, adharCardNumber
    const duplicate = await sikariController.findDuplicateSikari({
      mobileNumber,
      sikariId,
      smargId,
      adharCardNumber
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: 'A sikari with the same mobile number, sikari ID, smarg ID, or adhar card number already exists.'
        }
      });
    }

    const sikari = await sikariController.createSikari({
      sikariId,
      sikariName,
      mobileNumber,
      location,
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
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
      profilePhoto: req.files?.profilePhoto?.[0]?.filename,
      bannerPhoto: req.files?.bannerPhoto?.[0]?.filename,
      adharCardPhoto: req.files?.adharCardPhoto?.[0]?.filename,
      bankPassbookPhoto: req.files?.bankPassbookPhoto?.[0]?.filename
    });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.status(201).json({
      success: true,
      message: 'Sikari added successfully',
      data: {
        id: sikari._id,
        sikariId: sikari.sikariId,
        sikariName: sikari.sikariName,
        mobileNumber: sikari.mobileNumber,
        location: sikari.location,
        dateOfJoining: sikari.dateOfJoining,
        smargId: sikari.smargId,
        adharCardNumber: sikari.adharCardNumber,
        bankAccountNumber: sikari.bankAccountNumber,
        ifscCode: sikari.ifscCode,
        madhayamName: sikari.madhayamName,
        madhayamMobileNumber: sikari.madhayamMobileNumber,
        madhayamAddress: sikari.madhayamAddress,
        boatNumber: sikari.boatNumber,
        boatId: sikari.boatId,
        boatType: sikari.boatType,
        position: sikari.position,
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null,
        adharCardPhoto: sikari.adharCardPhoto ? `${baseUrl}/uploads/sikaris/${sikari.adharCardPhoto}` : null,
        bankPassbookPhoto: sikari.bankPassbookPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bankPassbookPhoto}` : null
      }
    });
  } catch (err) {
    console.error('Error adding sikari:', err);
    // Clean up uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          const filePath = path.join('uploads/sikaris', file.filename);
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
          message: `A sikari with this ${field} already exists`
        }
      });
    }
    
    // Handle other specific errors
    if (err.message) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Error adding sikari: ' + err.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding sikari'
      }
    });
  }
});

router.put('/update/:id', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 },
  { name: 'adharCardPhoto', maxCount: 1 },
  { name: 'bankPassbookPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = {};
    const {
      sikariName,
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
      position
    } = req.body;

    // Add fields to update if provided
    if (sikariName) updateData.sikariName = sikariName;
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (location) updateData.location = location;
    if (dateOfJoining) updateData.dateOfJoining = new Date(dateOfJoining);
    if (smargId) updateData.smargId = smargId;
    if (adharCardNumber) updateData.adharCardNumber = adharCardNumber;
    if (bankAccountNumber) updateData.bankAccountNumber = bankAccountNumber;
    if (ifscCode) updateData.ifscCode = ifscCode;
    if (madhayamName) updateData.madhayamName = madhayamName;
    if (madhayamMobileNumber) updateData.madhayamMobileNumber = madhayamMobileNumber;
    if (madhayamAddress) updateData.madhayamAddress = madhayamAddress;
    if (boatNumber) updateData.boatNumber = boatNumber;
    if (boatId) updateData.boatId = boatId;
    if (boatType) {
      if (!['company boat', 'self boat'].includes(boatType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BOAT_TYPE',
            message: 'Boat type must be either "company boat" or "self boat"'
          }
        });
      }
      updateData.boatType = boatType;
    }
    if (position) {
      if (!['personal duty', 'government register fisherman', 'illegal'].includes(position)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_POSITION',
            message: 'Position must be one of: personal duty, government register fisherman, illegal'
          }
        });
      }
      updateData.position = position;
    }

    // Add photo updates if provided
    if (req.files?.profilePhoto?.[0]) updateData.profilePhoto = req.files.profilePhoto[0].filename;
    if (req.files?.bannerPhoto?.[0]) updateData.bannerPhoto = req.files.bannerPhoto[0].filename;
    if (req.files?.adharCardPhoto?.[0]) updateData.adharCardPhoto = req.files.adharCardPhoto[0].filename;
    if (req.files?.bankPassbookPhoto?.[0]) updateData.bankPassbookPhoto = req.files.bankPassbookPhoto[0].filename;

    const sikari = await sikariController.updateSikari(req.params.id, updateData);

    if (!sikari) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SIKARI_NOT_FOUND',
          message: 'Sikari not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Sikari updated successfully',
      data: {
        id: sikari._id,
        sikariId: sikari.sikariId,
        sikariName: sikari.sikariName,
        mobileNumber: sikari.mobileNumber,
        location: sikari.location,
        dateOfJoining: sikari.dateOfJoining,
        smargId: sikari.smargId,
        boatNumber: sikari.boatNumber,
        boatId: sikari.boatId,
        boatType: sikari.boatType,
        position: sikari.position,
        profilePhoto: sikari.profilePhoto,
        bannerPhoto: sikari.bannerPhoto
      }
    });
  } catch (err) {
    console.error('Error updating sikari:', err);
    
    // Clean up uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          const filePath = path.join('uploads/sikaris', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      });
    }

    // Handle duplicate field errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: `A sikari with this ${field} already exists`
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating sikari'
      }
    });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const sikari = await sikariController.deleteSikari(req.params.id);
    if (!sikari) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SIKARI_NOT_FOUND',
          message: 'Sikari not found'
        }
      });
    }

    // Delete associated files
    const uploadDir = 'uploads/sikaris';
    if (sikari.profilePhoto) fs.unlinkSync(path.join(uploadDir, sikari.profilePhoto));
    if (sikari.bannerPhoto) fs.unlinkSync(path.join(uploadDir, sikari.bannerPhoto));
    if (sikari.adharCardPhoto) fs.unlinkSync(path.join(uploadDir, sikari.adharCardPhoto));
    if (sikari.bankPassbookPhoto) fs.unlinkSync(path.join(uploadDir, sikari.bankPassbookPhoto));

    res.json({
      success: true,
      message: 'Sikari deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting sikari:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting sikari'
      }
    });
  }
});

module.exports = router; 