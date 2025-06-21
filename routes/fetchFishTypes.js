const express = require('express');
const router = express.Router();
const FishType = require('../models/FishType');
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

// Get all active fish types
router.get('/all', async (req, res) => {
  try {
    const fishTypes = await FishType.find({ status: 'active' })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: fishTypes.map(fish => ({
        id: fish._id,
        name: fish.name,
        description: fish.description,
        pricePerKg: fish.pricePerKg
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching fish types'
    });
  }
});

// Search fish types by name
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const fishTypes = await FishType.find({
      name: { $regex: query, $options: 'i' },
      status: 'active'
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: fishTypes.map(fish => ({
        id: fish._id,
        name: fish.name,
        description: fish.description,
        pricePerKg: fish.pricePerKg
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error searching fish types'
    });
  }
});

// Get fish type by ID
router.get('/:id', async (req, res) => {
  try {
    const fishType = await FishType.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!fishType) {
      return res.status(404).json({
        success: false,
        message: 'Fish type not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: fishType._id,
        name: fishType.name,
        description: fishType.description,
        pricePerKg: fishType.pricePerKg
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching fish type'
    });
  }
});

module.exports = router; 