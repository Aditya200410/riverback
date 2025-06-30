const express = require('express');
const router = express.Router();
const sikariController = require('../controllers/sikariController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateFileUrl } = require('../utils/urlGenerator');

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
    
    // Convert file paths to full URLs
    const sikarisWithUrls = sikaris.map(sikari => ({
      ...sikari.toObject(),
      profilePhoto: generateFileUrl(req, sikari.profilePhoto),
      bannerPhoto: generateFileUrl(req, sikari.bannerPhoto),
      adharCardPhoto: generateFileUrl(req, sikari.adharCardPhoto),
      bankPassbookPhoto: generateFileUrl(req, sikari.bankPassbookPhoto)
    }));

    res.status(200).json({
      success: true,
      data: sikarisWithUrls
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
    const result = await sikariController.getSikariById(req.params.id);
    if (!result || !result.sikari) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SIKARI_NOT_FOUND',
          message: 'Sikari not found'
        }
      });
    }

    // Convert file paths to full URLs
    const sikariWithUrls = {
      ...result.sikari.toObject(),
      profilePhoto: generateFileUrl(req, result.sikari.profilePhoto),
      bannerPhoto: generateFileUrl(req, result.sikari.bannerPhoto),
      adharCardPhoto: generateFileUrl(req, result.sikari.adharCardPhoto),
      bankPassbookPhoto: generateFileUrl(req, result.sikari.bankPassbookPhoto)
    };

    res.status(200).json({
      success: true,
      data: {
        sikari: sikariWithUrls,
        paymentHistory: result.paymentHistory,
        collectionHistory: result.collectionHistory.map(collection => ({
          id: collection._id,
          sikahriName: collection.sikahriName,
          phoneNumber: collection.phoneNumber,
          fishes: collection.fishes,
          totalRupees: collection.totalRupees,
          netRupees: collection.netRupees,
          createdAt: collection.createdAt
        }))
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
      workLocation,
      homeAddress,
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

    // Generate password (first 3 letters of sikariName + @123)
    let passwordPrefix = sikariName ? sikariName.trim().substring(0, 3) : '';
    if (passwordPrefix.length > 0) {
      passwordPrefix = passwordPrefix[0].toUpperCase() + passwordPrefix.slice(1).toLowerCase();
    }
    const generatedPassword = `${passwordPrefix}@123`;

    const sikari = await sikariController.createSikari({
      sikariId,
      sikariName,
      mobileNumber,
      location,
      workLocation,
      homeAddress,
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
      bankPassbookPhoto: req.files?.bankPassbookPhoto?.[0]?.filename,
      password: generatedPassword
    });

    res.status(201).json({
      success: true,
      message: 'Sikari added successfully',
      data: {
        id: sikari._id,
        sikariId: sikari.sikariId,
        sikariName: sikari.sikariName,
        mobileNumber: sikari.mobileNumber,
        location: sikari.location,
        workLocation: sikari.workLocation,
        homeAddress: sikari.homeAddress,
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
        profilePhoto: generateFileUrl(req, sikari.profilePhoto),
        bannerPhoto: generateFileUrl(req, sikari.bannerPhoto),
        adharCardPhoto: generateFileUrl(req, sikari.adharCardPhoto),
        bankPassbookPhoto: generateFileUrl(req, sikari.bankPassbookPhoto),
        password: generatedPassword
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
    if (boatType) updateData.boatType = boatType;
    if (position) updateData.position = position;

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
        ...sikari,
        profilePhoto: generateFileUrl(req, sikari.profilePhoto),
        bannerPhoto: generateFileUrl(req, sikari.bannerPhoto),
        adharCardPhoto: generateFileUrl(req, sikari.adharCardPhoto),
        bankPassbookPhoto: generateFileUrl(req, sikari.bankPassbookPhoto)
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

// Shikari login endpoint
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    if (!mobileNumber || !password) {
      return res.status(400).json({ success: false, message: 'mobileNumber and password are required' });
    }
    const sikari = await require('../models/Sikari').findOne({ mobileNumber, status: 'active' });
    if (!sikari) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // Compare password (plain text for now, since Sikari model does not hash passwords)
    if (sikari.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: sikari._id,
        sikariId: sikari.sikariId,
        sikariName: sikari.sikariName,
        mobileNumber: sikari.mobileNumber,
        boatType: sikari.boatType,
        position: sikari.position,
        status: sikari.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 