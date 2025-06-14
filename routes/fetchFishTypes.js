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
router.get('/all', auth, async (req, res) => {
  try {
    const fishTypes = await FishType.find({ status: 'active' })
      .sort({ fishName: 1 });

    res.json({
      success: true,
      fishTypes: fishTypes.map(fish => ({
        id: fish._id,
        fishName: fish.fishName,
        price: fish.price
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
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const fishTypes = await FishType.find({
      fishName: { $regex: query, $options: 'i' },
      status: 'active'
    }).sort({ fishName: 1 });

    res.json({
      success: true,
      fishTypes: fishTypes.map(fish => ({
        id: fish._id,
        fishName: fish.fishName,
        price: fish.price
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
router.get('/:id', auth, async (req, res) => {
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
      fishType: {
        id: fishType._id,
        fishName: fishType.fishName,
        price: fishType.price
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