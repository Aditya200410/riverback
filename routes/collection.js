const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');

// Add a new collection
router.post('/', collectionController.addCollection);

// Get all collections
router.get('/', collectionController.getAllCollections);

module.exports = router; 