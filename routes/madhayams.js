const express = require('express');
const router = express.Router();
const madhayamController = require('../controllers/madhayamController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/madhayams';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'madhayam-' + uniqueSuffix + path.extname(file.originalname));
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
    const madhayams = await madhayamController.getAllMadhayams();
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: madhayams.map(madhayam => ({
        id: madhayam._id,
        madhayamId: madhayam.madhayamId,
        madhayamName: madhayam.madhayamName,
        mobileNumber: madhayam.mobileNumber,
        location: madhayam.location,
        dateOfJoining: madhayam.dateOfJoining,
        adharCardNumber: madhayam.adharCardNumber,
        bankAccountNumber: madhayam.bankAccountNumber,
        ifscCode: madhayam.ifscCode,
        profilePhoto: madhayam.profilePhoto ? `${baseUrl}/uploads/madhayams/${madhayam.profilePhoto}` : null,
        bannerPhoto: madhayam.bannerPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.bannerPhoto}` : null,
        adharCardPhoto: madhayam.adharCardPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.adharCardPhoto}` : null,
        bankPassbookPhoto: madhayam.bankPassbookPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.bankPassbookPhoto}` : null
      }))
    });
  } catch (err) {
    console.error('Error fetching madhayams:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching madhayams'
      }
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const madhayam = await madhayamController.getMadhayamById(req.params.id);
    if (!madhayam) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MADHAYAM_NOT_FOUND',
          message: 'Madhayam not found'
        }
      });
    }
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: {
        id: madhayam._id,
        madhayamId: madhayam.madhayamId,
        madhayamName: madhayam.madhayamName,
        mobileNumber: madhayam.mobileNumber,
        location: madhayam.location,
        dateOfJoining: madhayam.dateOfJoining,
        adharCardNumber: madhayam.adharCardNumber,
        bankAccountNumber: madhayam.bankAccountNumber,
        ifscCode: madhayam.ifscCode,
        profilePhoto: madhayam.profilePhoto ? `${baseUrl}/uploads/madhayams/${madhayam.profilePhoto}` : null,
        bannerPhoto: madhayam.bannerPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.bannerPhoto}` : null,
        adharCardPhoto: madhayam.adharCardPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.adharCardPhoto}` : null,
        bankPassbookPhoto: madhayam.bankPassbookPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.bankPassbookPhoto}` : null
      }
    });
  } catch (err) {
    console.error('Error fetching madhayam details:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching madhayam details'
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
    const {
      madhayamId,
      madhayamName,
      mobileNumber,
      location,
      dateOfJoining,
      adharCardNumber,
      bankAccountNumber,
      ifscCode
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'madhayamId', 'madhayamName', 'mobileNumber', 'location',
      'dateOfJoining', 'adharCardNumber', 'bankAccountNumber', 'ifscCode'
    ];

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

    // Validate required photos
    if (!req.files?.profilePhoto?.[0] || !req.files?.bannerPhoto?.[0] ||
        !req.files?.adharCardPhoto?.[0] || !req.files?.bankPassbookPhoto?.[0]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PHOTOS',
          message: 'All photos (profile, banner, Aadhar card, bank passbook) are required'
        }
      });
    }

    const madhayam = await madhayamController.createMadhayam({
      madhayamId,
      madhayamName,
      mobileNumber,
      location,
      dateOfJoining: new Date(dateOfJoining),
      adharCardNumber,
      bankAccountNumber,
      ifscCode,
      profilePhoto: req.files.profilePhoto[0].filename,
      bannerPhoto: req.files.bannerPhoto[0].filename,
      adharCardPhoto: req.files.adharCardPhoto[0].filename,
      bankPassbookPhoto: req.files.bankPassbookPhoto[0].filename
    });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.status(201).json({
      success: true,
      message: 'Madhayam added successfully',
      data: {
        id: madhayam._id,
        madhayamId: madhayam.madhayamId,
        madhayamName: madhayam.madhayamName,
        mobileNumber: madhayam.mobileNumber,
        location: madhayam.location,
        dateOfJoining: madhayam.dateOfJoining,
        adharCardNumber: madhayam.adharCardNumber,
        bankAccountNumber: madhayam.bankAccountNumber,
        ifscCode: madhayam.ifscCode,
        profilePhoto: madhayam.profilePhoto ? `${baseUrl}/uploads/madhayams/${madhayam.profilePhoto}` : null,
        bannerPhoto: madhayam.bannerPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.bannerPhoto}` : null,
        adharCardPhoto: madhayam.adharCardPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.adharCardPhoto}` : null,
        bankPassbookPhoto: madhayam.bankPassbookPhoto ? `${baseUrl}/uploads/madhayams/${madhayam.bankPassbookPhoto}` : null
      }
    });
  } catch (err) {
    console.error('Error adding madhayam:', err);
    
    // Clean up uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          const filePath = path.join('uploads/madhayams', file.filename);
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
          message: `A madhayam with this ${field} already exists`
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding madhayam'
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
      madhayamName,
      mobileNumber,
      location,
      dateOfJoining,
      adharCardNumber,
      bankAccountNumber,
      ifscCode
    } = req.body;

    // Add fields to update if provided
    if (madhayamName) updateData.madhayamName = madhayamName;
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (location) updateData.location = location;
    if (dateOfJoining) updateData.dateOfJoining = new Date(dateOfJoining);
    if (adharCardNumber) updateData.adharCardNumber = adharCardNumber;
    if (bankAccountNumber) updateData.bankAccountNumber = bankAccountNumber;
    if (ifscCode) updateData.ifscCode = ifscCode;

    // Add photo updates if provided
    if (req.files?.profilePhoto?.[0]) updateData.profilePhoto = req.files.profilePhoto[0].filename;
    if (req.files?.bannerPhoto?.[0]) updateData.bannerPhoto = req.files.bannerPhoto[0].filename;
    if (req.files?.adharCardPhoto?.[0]) updateData.adharCardPhoto = req.files.adharCardPhoto[0].filename;
    if (req.files?.bankPassbookPhoto?.[0]) updateData.bankPassbookPhoto = req.files.bankPassbookPhoto[0].filename;

    const madhayam = await madhayamController.updateMadhayam(req.params.id, updateData);

    if (!madhayam) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MADHAYAM_NOT_FOUND',
          message: 'Madhayam not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Madhayam updated successfully',
      data: {
        id: madhayam._id,
        madhayamId: madhayam.madhayamId,
        madhayamName: madhayam.madhayamName,
        mobileNumber: madhayam.mobileNumber,
        location: madhayam.location,
        dateOfJoining: madhayam.dateOfJoining,
        adharCardNumber: madhayam.adharCardNumber,
        bankAccountNumber: madhayam.bankAccountNumber,
        ifscCode: madhayam.ifscCode,
        profilePhoto: madhayam.profilePhoto,
        bannerPhoto: madhayam.bannerPhoto
      }
    });
  } catch (err) {
    console.error('Error updating madhayam:', err);
    
    // Clean up uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          const filePath = path.join('uploads/madhayams', file.filename);
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
          message: `A madhayam with this ${field} already exists`
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating madhayam'
      }
    });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const madhayam = await madhayamController.deleteMadhayam(req.params.id);
    if (!madhayam) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MADHAYAM_NOT_FOUND',
          message: 'Madhayam not found'
        }
      });
    }

    // Delete associated files
    const uploadDir = 'uploads/madhayams';
    if (madhayam.profilePhoto) fs.unlinkSync(path.join(uploadDir, madhayam.profilePhoto));
    if (madhayam.bannerPhoto) fs.unlinkSync(path.join(uploadDir, madhayam.bannerPhoto));
    if (madhayam.adharCardPhoto) fs.unlinkSync(path.join(uploadDir, madhayam.adharCardPhoto));
    if (madhayam.bankPassbookPhoto) fs.unlinkSync(path.join(uploadDir, madhayam.bankPassbookPhoto));

    res.json({
      success: true,
      message: 'Madhayam deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting madhayam:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting madhayam'
      }
    });
  }
});

module.exports = router; 