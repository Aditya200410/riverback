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
        description: fishType.description || '', // Handle null/undefined descriptions
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
        description: fishType.description || '', // Handle null/undefined descriptions
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
    console.log('Full request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { name, description, pricePerKg } = req.body;
    
    console.log('Received data:', { name, description, pricePerKg });

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required'
        }
      });
    }

    const fishType = await fishTypeController.createFishType({
      name: name.trim(),
      description: description ? description.trim() : '', // Set empty string if no description
      pricePerKg: pricePerKg ? Number(pricePerKg) : 0 // Default to 0 if not provided
    });

    console.log('Created fish type:', fishType);

    res.status(201).json({
      success: true,
      message: 'Fish type added successfully',
      data: {
        id: fishType._id,
        name: fishType.name,
        description: fishType.description || '',
        pricePerKg: fishType.pricePerKg
      }
    });
  } catch (err) {
    console.error('Error adding fish type:', err);
    
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
    if (name && name.trim() !== '') {
      updateData.name = name.trim();
    }
    
    // Always allow description updates, even if empty
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
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
      updateData.pricePerKg = Number(pricePerKg);
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
        description: fishType.description || '',
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

// Bulk add fish types
router.post('/bulk-add', async (req, res) => {
  try {
    // Default fish types in Hindi if not provided in body
    const defaultFishTypes = [
      { name: 'रेहू', description: '' },
      { name: 'कलवट', description: '' },
      { name: 'कतला', description: '' },
      { name: 'बड़ी मच्छी', description: '' },
      { name: 'छोटी मच्छी', description: '' },
      { name: 'सिंघाड़ बड़ी', description: '' },
      { name: 'पड़ेन बड़ी', description: '' },
      { name: 'सिंघाड़ छोटी', description: '' },
      { name: 'बाम', description: '' },
      { name: 'सावल', description: '' },
      { name: 'काबरा', description: '' },
      { name: 'मीनोर', description: '' },
      { name: 'विशेष मच्छी', description: '' },
      { name: 'ब्लू गिरी', description: '' },
      { name: 'मिक्स', description: '' },
      { name: 'अन्य।', description: '' }
    ];
    
    const fishTypesArray = req.body.fishTypes || defaultFishTypes;
    
    // Ensure all items have name and description
    const processedFishTypes = fishTypesArray.map(fishType => ({
      name: fishType.name,
      description: fishType.description || '',
      pricePerKg: fishType.pricePerKg || 0
    }));
    
    const results = await fishTypeController.bulkAddFishTypes(processedFishTypes);
    res.status(201).json({
      success: true,
      message: 'Fish types added successfully',
      data: results.map(fishType => ({
        id: fishType._id,
        name: fishType.name,
        description: fishType.description || '',
        pricePerKg: fishType.pricePerKg
      }))
    });
  } catch (err) {
    console.error('Error bulk adding fish types:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error bulk adding fish types'
      }
    });
  }
});

module.exports = router;
