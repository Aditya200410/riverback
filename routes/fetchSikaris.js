const express = require('express');
const router = express.Router();
const Sikari = require('../models/Sikari');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Get all active sikaris
router.get('/all', async (req, res) => {
  try {
    const sikaris = await Sikari.find({ status: 'active' })
      .sort({ dateOfJoining: -1 });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      sikaris: sikaris.map(sikari => ({
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
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching sikaris'
    });
  }
});

// Get sikari by ID
router.get('/:id', async (req, res) => {
  try {
    const sikari = await Sikari.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!sikari) {
      return res.status(404).json({
        success: false,
        message: 'Sikari not found'
      });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      sikari: {
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
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching sikari'
    });
  }
});

// Search sikaris
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const sikaris = await Sikari.find({
      status: 'active',
      $or: [
        { sikariName: { $regex: query, $options: 'i' } },
        { sikariId: { $regex: query, $options: 'i' } },
        { mobileNumber: { $regex: query, $options: 'i' } },
        { smargId: { $regex: query, $options: 'i' } },
        { boatNumber: { $regex: query, $options: 'i' } }
      ]
    }).sort({ dateOfJoining: -1 });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      sikaris: sikaris.map(sikari => ({
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
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error searching sikaris'
    });
  }
});

// Get sikaris by boat type
router.get('/boat-type/:type', async (req, res) => {
  try {
    const sikaris = await Sikari.find({
      boatType: req.params.type,
      status: 'active'
    }).sort({ dateOfJoining: -1 });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      sikaris: sikaris.map(sikari => ({
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
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching sikaris by boat type'
    });
  }
});

// Get sikaris by position
router.get('/position/:position', async (req, res) => {
  try {
    const sikaris = await Sikari.find({
      position: req.params.position,
      status: 'active'
    }).sort({ dateOfJoining: -1 });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      sikaris: sikaris.map(sikari => ({
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
        profilePhoto: sikari.profilePhoto ? `${baseUrl}/uploads/sikaris/${sikari.profilePhoto}` : null,
        bannerPhoto: sikari.bannerPhoto ? `${baseUrl}/uploads/sikaris/${sikari.bannerPhoto}` : null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching sikaris by position'
    });
  }
});

module.exports = router; 