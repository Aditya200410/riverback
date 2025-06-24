const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const User = require('../models/user');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/users')
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

// Routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/add', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 }
]), userController.createUser);
router.put('/update/:id', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'bannerPhoto', maxCount: 1 }
]), userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);

module.exports = router; 