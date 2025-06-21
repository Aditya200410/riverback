const express = require('express');
const router = express.Router();
const fishTypeController = require('../controllers/fishTypeController');

// Get all fish types
router.get('/', async (req, res) => {
  try {
    const fishTypes = await fishTypeController.getAllFishTypes();
    res.json({
      success: true,
      data: fishTypes.map(fishType => ({
        id: fishType._id,
        name: fishType.name,
        description: fishType.description,
        pricePerKg: fishType.pricePerKg
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

// Get fish type by ID
router.get('/:id', async (req, res) => {
  try {
    const fishType = await fishTypeController.getFishTypeById(req.params.id);
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
        description: fishType.description,
        pricePerKg: fishType.pricePerKg
      }
    });
  } catch (err) {
    console.error('Error fetching fish type details:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching fish type details'
      }
    });
  }
});

// Create new fish type
router.post('/add', async (req, res) => {
  try {
    const { name, description, pricePerKg } = req.body;

    const fishType = await fishTypeController.createFishType({
      name,
      description,
      pricePerKg: Number(pricePerKg)
    });

    res.status(201).json({
      success: true,
      message: 'Fish type added successfully',
      data: {
        id: fishType._id,
        name: fishType.name,
        description: fishType.description,
        pricePerKg: fishType.pricePerKg
      }
    });
  } catch (err) {
    console.error('Error adding fish type:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding fish type'
      }
    });
  }
});

// Update fish type
router.put('/update/:id', async (req, res) => {
  try {
    const { name, description, pricePerKg } = req.body;
    const updateData = {};

    // Add fields to update if provided
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (pricePerKg !== undefined) {
      if (pricePerKg < 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRICE',
            message: 'Price per kg must be greater than or equal to 0'
          }
        });
      }
      updateData.pricePerKg = pricePerKg;
    }

    const fishType = await fishTypeController.updateFishType(req.params.id, updateData);

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
      message: 'Fish type updated successfully',
      data: {
        id: fishType._id,
        name: fishType.name,
        description: fishType.description,
        pricePerKg: fishType.pricePerKg
      }
    });
  } catch (err) {
    console.error('Error updating fish type:', err);

    // Handle duplicate field errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_FIELD',
          message: 'A fish type with this name already exists'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating fish type'
      }
    });
  }
});

// Delete fish type
router.delete('/delete/:id', async (req, res) => {
  try {
    const fishType = await fishTypeController.deleteFishType(req.params.id);
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
      message: 'Fish type deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting fish type:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting fish type'
      }
    });
  }
});

module.exports = router; 