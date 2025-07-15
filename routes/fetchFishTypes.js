
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
    console.log('Full request body:', req.body);
    console.log('Request headers:', req.headers);

    const { name, description, pricePerKg } = req.body;

    console.log('Received data:', { name, description, pricePerKg });

    const fishType = await fishTypeController.createFishType({
      name,
      description,
      pricePerKg: Number(pricePerKg)
    });

    console.log('Created fish type:', fishType);

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

// Bulk add fish types
router.post('/bulk-add', async (req, res) => {
  try {
    // Default fish types in Hindi if not provided in body
    const defaultFishTypes = [
      { name: 'रेहू' },
      { name: 'कलवट' },
      { name: 'कतला' },
      { name: 'बड़ी मच्छी' },
      { name: 'छोटी मच्छी' },
      { name: 'सिंघाड़ बड़ी' },
      { name: 'पड़ेन बड़ी' },
      { name: 'सिंघाड़ छोटी' },
      { name: 'बाम' },
      { name: 'सावल' },
      { name: 'काबरा' },
      { name: 'मीनोर' },
      { name: 'विशेष मच्छी' },
      { name: 'ब्लू गिरी' },
      { name: 'मिक्स' },
      { name: 'अन्य।' }
    ];
    const fishTypesArray = req.body.fishTypes || defaultFishTypes;
    const results = await fishTypeController.bulkAddFishTypes(fishTypesArray);
    res.status(201).json({
      success: true,
      message: 'Fish types added successfully',
      data: results.map(fishType => ({
        id: fishType._id,
        name: fishType.name,
        description: fishType.description,
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

module.exports = router;  this is not returning and accepting the name and description fix it

Edit
Looking at your code, I can see a few issues that might be causing problems with name and description handling. Here are the main fixes needed:


Fixed Fish Type Routes
Code 
The main fixes I made to handle name and description properly:

Added validation for required name field in the create route
Added proper handling for description - now it accepts empty strings and handles undefined values
Added trimming for name and description to remove extra whitespace
Fixed the bulk-add route to include description field in default fish types
Improved error handling for duplicate names in the create route
Added fallback values - empty string for description if not provided, 0 for pricePerKg
Fixed the update route to properly handle description updates (even if empty)
Key changes:

Name validation: Now checks if name exists and is not empty
Description handling: Accepts both provided descriptions and defaults to empty string
Consistent response format: Always returns description field (even if empty)
Input sanitization: Trims whitespace from name and description
Better error messages: More specific validation errors
This should now properly accept and return both name and description fields in all operations.




Fix this fetch also for the error const express = require('express');
const router = express.Router();
const FishType = require('../models/FishType');
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
    const user = await FishType.findById(userId);
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
  } catch {
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

Edit

Fixed Fish Type Fetch Routes
Code 
The main fixes I made to handle the errors and improve the fetch routes:

Key Issues Fixed:
Auth Middleware Error: The auth middleware was using FishType.findById(userId) instead of the correct User.findById(userId). This was a critical bug.
Missing Error Handling: Added proper error handling in the auth middleware catch block.
Consistent Error Response Format: All error responses now follow the same format with error.code and error.message.
Null/Undefined Handling: Added fallback values for description and pricePerKg fields.
Input Validation: Added validation for search query and MongoDB ObjectId format.
Better Error Messages: More specific error codes and messages.
Specific Changes:
Auth Middleware: Fixed to use the correct User model
Error Responses: Standardized all error responses with proper structure
Data Handling: Added fallback values for missing fields (description defaults to empty string, pricePerKg defaults to 0)
Validation: Added input validation for search queries and ID formats
MongoDB Error Handling: Added specific handling for MongoDB CastError
Logging: Improved error logging with more context
Additional Improvements:
Trim whitespace from search queries
Validate ObjectId format before querying
Handle MongoDB-specific errors like CastError
Consistent response structure across all endpoints
Make sure you have the correct User model imported at the top of the file. If your User model is in a different location, update the import path accordingly.







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
Express Router Fish Type Endpoint - Claude
  
