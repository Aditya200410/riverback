const express = require('express');
const router = express.Router();
const boatController = require('../controllers/boatController');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/boats')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
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
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
router.get('/', auth, boatController.getAllBoats);
router.get('/:id', auth, boatController.getBoatById);
router.post('/add', auth, upload.fields([
  { name: 'boatPhoto', maxCount: 1 },
  { name: 'registrationPhoto', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 }
]), boatController.createBoat);
router.put('/update/:id', auth, upload.fields([
  { name: 'boatPhoto', maxCount: 1 },
  { name: 'registrationPhoto', maxCount: 1 },
  { name: 'insurancePhoto', maxCount: 1 }
]), boatController.updateBoat);
router.delete('/delete/:id', auth, boatController.deleteBoat);

module.exports = router; 