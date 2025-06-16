const express = require('express');
const router = express.Router();
const boatController = require('../controllers/boatController');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Middleware to protect routes
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ 
    success: false,
    error: {
      code: 'NO_TOKEN',
      message: 'No token, authorization denied'
    }
  });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }
};

// Routes
router.get('/', auth, async (req, res) => {
  try {
    const boats = await boatController.getAllBoats(req.user.id);
    res.json({
      success: true,
      boats: boats.map(boat => ({
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto,
        registrationPhoto: boat.registrationPhoto,
        insurancePhoto: boat.insurancePhoto,
        status: boat.status
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching boats'
      }
    });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const boat = await boatController.getBoatById(req.params.id, req.user.id);
    if (!boat) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOAT_NOT_FOUND',
          message: 'Boat not found'
        }
      });
    }
    res.json({
      success: true,
      boat: {
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto,
        registrationPhoto: boat.registrationPhoto,
        insurancePhoto: boat.insurancePhoto,
        status: boat.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching boat details'
      }
    });
  }
});

router.post('/add', auth, upload.fields([
  { name: 'boatPhoto', maxCount: 1 },
  { name: 'registrationPhoto', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, registrationNumber, capacity } = req.body;
    
    if (!name || !registrationNumber || !capacity) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name, registration number, and capacity are required'
        }
      });
    }

    const boat = await boatController.createBoat({
      name,
      registrationNumber,
      capacity,
      boatPhoto: req.files?.boatPhoto?.[0]?.filename,
      registrationPhoto: req.files?.registrationPhoto?.[0]?.filename,
      insurancePhoto: req.files?.insurancePhoto?.[0]?.filename,
      companyId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Boat added successfully',
      boat: {
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto,
        registrationPhoto: boat.registrationPhoto,
        insurancePhoto: boat.insurancePhoto,
        status: boat.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding boat'
      }
    });
  }
});

router.put('/update/:id', auth, upload.fields([
  { name: 'boatPhoto', maxCount: 1 },
  { name: 'registrationPhoto', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, registrationNumber, capacity } = req.body;
    const boat = await boatController.updateBoat(req.params.id, {
      name,
      registrationNumber,
      capacity,
      boatPhoto: req.files?.boatPhoto?.[0]?.filename,
      registrationPhoto: req.files?.registrationPhoto?.[0]?.filename,
      insurancePhoto: req.files?.insurancePhoto?.[0]?.filename
    }, req.user.id);

    if (!boat) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOAT_NOT_FOUND',
          message: 'Boat not found'
        }
      });
    }

    res.json({
      success: true,
      message: 'Boat updated successfully',
      boat: {
        id: boat._id,
        name: boat.name,
        registrationNumber: boat.registrationNumber,
        capacity: boat.capacity,
        boatPhoto: boat.boatPhoto,
        registrationPhoto: boat.registrationPhoto,
        insurancePhoto: boat.insurancePhoto,
        status: boat.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating boat'
      }
    });
  }
});

router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const boat = await boatController.deleteBoat(req.params.id, req.user.id);
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
    console.error(err);
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