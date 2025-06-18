const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const { auth } = require('../middleware/auth');

// Get all signed-in managers
router.get('/signed-in', auth(['company']), async (req, res) => {
  try {
    const signedInManagers = await Manager.find({
      status: 'active',
      isSignedIn: true
    }).select('-password');

    res.json({
      success: true,
      data: signedInManagers.map(manager => ({
        id: manager._id,
        name: manager.name,
        email: manager.email,
        mobile: manager.mobile,
        location: manager.location,
        signInTime: manager.signInTime,
        lastActive: manager.lastActive
      }))
    });
  } catch (err) {
    console.error('Error fetching signed-in managers:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching signed-in managers'
      }
    });
  }
});

module.exports = router; 