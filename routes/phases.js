const express = require('express');
const router = express.Router();
const Phase = require('../models/Phase');
const { auth } = require('../middleware/auth');

// Get all phases
router.get('/', auth(['company']), async (req, res) => {
  try {
    const phases = await Phase.find();
    res.json({
      success: true,
      data: phases
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching phases'
      }
    });
  }
});

// Get single phase
router.get('/:id', auth(['company']), async (req, res) => {
  try {
    const phase = await Phase.findById(req.params.id);
    if (!phase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PHASE_NOT_FOUND',
          message: 'Phase not found'
        }
      });
    }
    res.json({
      success: true,
      data: phase
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching phase'
      }
    });
  }
});

// Create phase
router.post('/', auth(['company']), async (req, res) => {
  try {
    const phase = new Phase(req.body);
    await phase.save();
    res.status(201).json({
      success: true,
      data: phase
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }
});

// Update phase
router.put('/:id', auth(['company']), async (req, res) => {
  try {
    const phase = await Phase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!phase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PHASE_NOT_FOUND',
          message: 'Phase not found'
        }
      });
    }
    res.json({
      success: true,
      data: phase
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }
});

// Delete phase
router.delete('/:id', auth(['company']), async (req, res) => {
  try {
    const phase = await Phase.findByIdAndDelete(req.params.id);
    if (!phase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PHASE_NOT_FOUND',
          message: 'Phase not found'
        }
      });
    }
    res.json({
      success: true,
      message: 'Phase deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting phase'
      }
    });
  }
});

module.exports = router; 