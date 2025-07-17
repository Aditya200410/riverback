const express = require('express');
const router = express.Router();
const boatController = require('../controllers/boatController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/boats';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'boat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Routes
router.get('/', async (req, res) => {
  try {
    const boats = await boatController.getAllBoats(null);
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: boats.map(boat => ({
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto ? `${baseUrl}/uploads/boats/${boat.boatPhoto}` : null,
        registrationPhoto: boat.registrationPhoto ? `${baseUrl}/uploads/boats/${boat.registrationPhoto}` : null,
        insurancePhoto: boat.insurancePhoto ? `${baseUrl}/uploads/boats/${boat.insurancePhoto}` : null,
        status: boat.status
      }))
    });
  } catch (err) {
    console.error('Error fetching boats:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching boats'
      }
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const boat = await boatController.getBoatById(req.params.id, null);
    if (!boat) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOAT_NOT_FOUND',
          message: 'Boat not found'
        }
      });
  }
    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      data: {
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto ? `${baseUrl}/uploads/boats/${boat.boatPhoto}` : null,
        registrationPhoto: boat.registrationPhoto ? `${baseUrl}/uploads/boats/${boat.registrationPhoto}` : null,
        insurancePhoto: boat.insurancePhoto ? `${baseUrl}/uploads/boats/${boat.insurancePhoto}` : null,
        status: boat.status
      }
    });
  } catch (err) {
    console.error('Error fetching boat details:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching boat details'
      }
    });
  }
});

router.post('/add', upload.fields([
  { name: 'boatPhoto', maxCount: 1 },
  { name: 'registrationPhoto', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, registrationNumber, capacity } = req.body;

    const boat = await boatController.createBoat({
      name,
      registrationNumber,
      capacity: Number(capacity),
      boatPhoto: req.files?.boatPhoto?.[0]?.filename,
      registrationPhoto: req.files?.registrationPhoto?.[0]?.filename,
      insurancePhoto: req.files?.insurancePhoto?.[0]?.filename,
      companyId: null
    });

    const baseUrl = req.protocol + '://' + req.get('host');
    res.status(201).json({
      success: true,
      message: 'Boat added successfully',
      data: {
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto ? `${baseUrl}/uploads/boats/${boat.boatPhoto}` : null,
        registrationPhoto: boat.registrationPhoto ? `${baseUrl}/uploads/boats/${boat.registrationPhoto}` : null,
        insurancePhoto: boat.insurancePhoto ? `${baseUrl}/uploads/boats/${boat.insurancePhoto}` : null
      }
    });
  } catch (err) {
    console.error('Error adding boat:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding boat'
      }
    });
  }
});

router.put('/update/:id', upload.fields([
  { name: 'boatPhoto', maxCount: 1 },
  { name: 'registrationPhoto', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, registrationNumber, capacity } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (registrationNumber) updateData.registrationNumber = registrationNumber;
    if (capacity) {
      const capacityNum = Number(capacity);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CAPACITY',
            message: 'Capacity must be a positive number'
          }
        });
      }
      updateData.capacity = capacityNum;
    }

    // Add photo updates if provided
    if (req.files?.boatPhoto?.[0]) updateData.boatPhoto = req.files.boatPhoto[0].filename;
    if (req.files?.registrationPhoto?.[0]) updateData.registrationPhoto = req.files.registrationPhoto[0].filename;
    if (req.files?.insurancePhoto?.[0]) updateData.insurancePhoto = req.files.insurancePhoto[0].filename;

    const boat = await boatController.updateBoat(req.params.id, updateData, null);

    if (!boat) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOAT_NOT_FOUND',
          message: 'Boat not found'
        }
      });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      message: 'Boat updated successfully',
      data: {
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto ? `${baseUrl}/uploads/boats/${boat.boatPhoto}` : null,
        registrationPhoto: boat.registrationPhoto ? `${baseUrl}/uploads/boats/${boat.registrationPhoto}` : null,
        insurancePhoto: boat.insurancePhoto ? `${baseUrl}/uploads/boats/${boat.insurancePhoto}` : null,
        status: boat.status
      }
    });
  } catch (err) {
    console.error('Error updating boat:', err);
    
    // Clean up uploaded files if there's an error
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          const filePath = path.join('uploads/boats', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      });
    }

    // Handle duplicate registration number error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_REGISTRATION',
          message: 'A boat with this registration number already exists'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating boat'
      }
    });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const boat = await boatController.deleteBoat(req.params.id, null);
    if (!boat) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOAT_NOT_FOUND',
          message: 'Boat not found'
        }
      });
    }

    // Delete associated files
    const uploadDir = 'uploads/boats';
    if (boat.boatPhoto) fs.unlinkSync(path.join(uploadDir, boat.boatPhoto));
    if (boat.registrationPhoto) fs.unlinkSync(path.join(uploadDir, boat.registrationPhoto));
    if (boat.insurancePhoto) fs.unlinkSync(path.join(uploadDir, boat.insurancePhoto));

    res.json({
      success: true,
      message: 'Boat deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting boat:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting boat'
      }
    });
  }
});

module.exports = router; 