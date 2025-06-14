const express = require('express');
const router = express.Router();
const Sikari = require('../models/Sikari');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/sikaris')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
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

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Add new sikari
router.post('/add', auth, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 },
  { name: 'adharCardPhoto', maxCount: 1 },
  { name: 'bankPassbookPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
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

    // Check if required files are uploaded
    if (!req.files || !req.files.profilePhoto || !req.files.bannerPhoto || 
        !req.files.adharCardPhoto || !req.files.bankPassbookPhoto) {
      return res.status(400).json({
        success: false,
        message: 'All required photos must be uploaded'
      });
    }

    // Check if sikariId already exists
    const existingSikari = await Sikari.findOne({ sikariId });
    if (existingSikari) {
      return res.status(400).json({
        success: false,
        message: 'Sikari ID already exists'
      });
    }

    const sikari = new Sikari({
      profilePhoto: req.files.profilePhoto[0].path,
      bannerPhoto: req.files.bannerPhoto[0].path,
      sikariId,
      sikariName,
      mobileNumber,
      location,
      dateOfJoining,
      smargId,
      adharCardNumber,
      adharCardPhoto: req.files.adharCardPhoto[0].path,
      bankAccountNumber,
      ifscCode,
      bankPassbookPhoto: req.files.bankPassbookPhoto[0].path,
      madhayamName,
      madhayamMobileNumber,
      madhayamAddress,
      boatNumber,
      boatId,
      boatType,
      position
    });

    await sikari.save();

    res.status(201).json({
      success: true,
      message: 'Sikari added successfully',
      sikari: {
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
        position: sikari.position
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error adding sikari'
    });
  }
});

// Update sikari
router.put('/update/:id', auth, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 },
  { name: 'adharCardPhoto', maxCount: 1 },
  { name: 'bankPassbookPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };
    const files = req.files;

    // Update file paths if new files are uploaded
    if (files) {
      if (files.profilePhoto) updateData.profilePhoto = files.profilePhoto[0].path;
      if (files.bannerPhoto) updateData.bannerPhoto = files.bannerPhoto[0].path;
      if (files.adharCardPhoto) updateData.adharCardPhoto = files.adharCardPhoto[0].path;
      if (files.bankPassbookPhoto) updateData.bankPassbookPhoto = files.bankPassbookPhoto[0].path;
    }

    const sikari = await Sikari.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: 'active'
      },
      updateData,
      { new: true }
    );

    if (!sikari) {
      return res.status(404).json({
        success: false,
        message: 'Sikari not found'
      });
    }

    res.json({
      success: true,
      message: 'Sikari updated successfully',
      sikari: {
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
        position: sikari.position
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error updating sikari'
    });
  }
});

// Delete sikari (soft delete)
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const sikari = await Sikari.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: 'active'
      },
      { status: 'deleted' },
      { new: true }
    );

    if (!sikari) {
      return res.status(404).json({
        success: false,
        message: 'Sikari not found'
      });
    }

    res.json({
      success: true,
      message: 'Sikari deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error deleting sikari'
    });
  }
});

module.exports = router; 