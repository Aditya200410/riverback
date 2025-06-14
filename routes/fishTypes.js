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

// Add new fish type
router.post('/add', auth, async (req, res) => {
  try {
    const { fishName, price } = req.body;

    if (!fishName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Fish name and price are required'
      });
    }

    // Check if fish type already exists
    const existingFish = await FishType.findOne({ 
      fishName: fishName.toLowerCase(),
      status: 'active'
    });

    if (existingFish) {
      return res.status(400).json({
        success: false,
        message: 'Fish type already exists'
      });
    }

    const fishType = new FishType({
      fishName: fishName.toLowerCase(),
      price: price
    });

    await fishType.save();

    res.status(201).json({
      success: true,
      message: 'Fish type added successfully',
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
      message: 'Error adding fish type'
    });
  }
});

// Update fish price
router.put('/update/:id', auth, async (req, res) => {
  try {
    const { price } = req.body;

    if (!price) {
      return res.status(400).json({
        success: false,
        message: 'Price is required'
      });
    }

    const fishType = await FishType.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: 'active'
      },
      { price: price },
      { new: true }
    );

    if (!fishType) {
      return res.status(404).json({
        success: false,
        message: 'Fish type not found'
      });
    }

    res.json({
      success: true,
      message: 'Price updated successfully',
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
      message: 'Error updating fish price'
    });
  }
});

// Delete fish type (soft delete)
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const fishType = await FishType.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: 'active'
      },
      { status: 'deleted' },
      { new: true }
    );

    if (!fishType) {
      return res.status(404).json({
        success: false,
        message: 'Fish type not found'
      });
    }

    res.json({
      success: true,
      message: 'Fish type deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error deleting fish type'
    });
  }
});

module.exports = router; 