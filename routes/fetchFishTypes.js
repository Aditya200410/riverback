const express = require('express');
const router = express.Router();
const FishType = require('../models/FishType');
const User = require('../models/User'); // Import the correct User model

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
    // Use the correct User model instead of FishType
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'Invalid user'
        }
      });
    }
    req.user = { id: user._id };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_USER',
        message: 'Invalid user'
      }
    });
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
        description: fish.description || '', // Handle null/undefined descriptions
        pricePerKg: fish.pricePerKg || 0 // Handle null/undefined prices
      }))
    });
  } catch (err) {
    console.error('Error fetching fish types:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching fish types'
      }
    });
  }
});

// Search fish types by name
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required'
        }
      });
    }

    const fishTypes = await FishType.find({
      name: { $regex: query.trim(), $options: 'i' },
      status: 'active'
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: fishTypes.map(fish => ({
        id: fish._id,
        name: fish.name,
        description: fish.description || '', // Handle null/undefined descriptions
        pricePerKg: fish.pricePerKg || 0 // Handle null/undefined prices
      }))
    });
  } catch (err) {
    console.error('Error searching fish types:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error searching fish types'
      }
    });
  }
});

// Get fish type by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid fish type ID format'
        }
      });
    }

    const fishType = await FishType.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!fishType) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FISH_TYPE_NOT_FOUND',
          message: 'Fish type not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: fishType._id,
        name: fishType.name,
        description: fishType.description || '', // Handle null/undefined descriptions
        pricePerKg: fishType.pricePerKg || 0 // Handle null/undefined prices
      }
    });
  } catch (err) {
    console.error('Error fetching fish type:', err);
    
    // Handle MongoDB cast errors
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid fish type ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching fish type'
      }
    });
  }
});

module.exports = router;
