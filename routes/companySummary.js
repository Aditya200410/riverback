const express = require('express');
const router = express.Router();
const FishType = require('../models/FishType');
const Manager = require('../models/Manager');
const SecurityUser = require('../models/SecurityUser');
const Boat = require('../models/Boat');
const Sikari = require('../models/Sikari');

// Get company summary
router.get('/', async (req, res) => {
  try {
    // Get total fish types count
    const totalFishTypes = await FishType.countDocuments();

    // Get fish types with their details
    const fishTypes = await FishType.find();

    // Get total managers count
    const totalManagers = await Manager.countDocuments();

    // Get total security count
    const totalSecurity = await SecurityUser.countDocuments();

    // Get total boats count
    const totalBoats = await Boat.countDocuments();

    // Get total sikaris count
    const totalSikaris = await Sikari.countDocuments();

    // Get active managers count
    const activeManagers = await Manager.countDocuments({ status: 'active' });

    // Get active security count
    const activeSecurity = await SecurityUser.countDocuments({ status: 'active' });

    // Get active boats count
    const activeBoats = await Boat.countDocuments({ status: 'active' });

    // Get active sikaris count
    const activeSikaris = await Sikari.countDocuments({ status: 'active' });

    // Get recent managers (last 7 days)
    const recentManagers = await Manager.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).count();

    // Get recent security (last 7 days)
    const recentSecurity = await SecurityUser.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).count();

    // Get recent sikaris (last 7 days)
    const recentSikaris = await Sikari.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).count();

    res.json({
      success: true,
      data: {
        totals: {
          fishTypes: totalFishTypes,
          managers: totalManagers,
          security: totalSecurity,
          boats: totalBoats,
          sikaris: totalSikaris
        },
        active: {
          managers: activeManagers,
          security: activeSecurity,
          boats: activeBoats,
          sikaris: activeSikaris
        },
        recent: {
          managers: recentManagers,
          security: recentSecurity,
          sikaris: recentSikaris
        },
        fishTypes: fishTypes.map(fish => ({
          name: fish.name,
          description: fish.description,
          pricePerKg: fish.pricePerKg
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching company summary:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching company summary'
      }
    });
  }
});

module.exports = router; 