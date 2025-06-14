// Improved Express Auth Routes with better structure, security, and async handling
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const CompanyUser = require('../models/CompanyUser');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

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

router.get('/validate-token', auth, async (req, res) => {
  try {
    const user = await CompanyUser.findById(req.user.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /signup
router.post('/signup', async (req, res) => {
  const {
    companyName,
    companyType,
    registrationNumber,
    mobileNumber,
    address,
    city,
    state,
    password,
    verifyPassword
  } = req.body;
  
  if (!companyName || !companyType || !registrationNumber || !mobileNumber || 
      !address || !city || !state || !password || !verifyPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== verifyPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await CompanyUser.findOne({ 
      $or: [
        { registrationNumber },
        { mobileNumber }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Company with this registration number or mobile number already exists' 
      });
    }

    const user = new CompanyUser({
      companyName,
      companyType,
      registrationNumber,
      mobileNumber,
      address,
      city,
      state,
      password
    });
    
    await user.save();

    const token = jwt.sign(
      { id: user._id, registrationNumber: user.registrationNumber }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        companyName,
        companyType,
        registrationNumber,
        mobileNumber,
        address,
        city,
        state
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Company registration error' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { mobileNumber, password } = req.body;
  if (!mobileNumber || !password) {
    return res.status(400).json({ message: 'Mobile number and password required' });
  }

  try {
    const user = await CompanyUser.findOne({ mobileNumber });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, registrationNumber: user.registrationNumber }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        companyName: user.companyName,
        companyType: user.companyType,
        registrationNumber: user.registrationNumber,
        mobileNumber: user.mobileNumber,
        address: user.address,
        city: user.city,
        state: user.state
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login error' });
  }
});

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
  const { mobileNumber } = req.body;
  try {
    const user = await CompanyUser.findOne({ mobileNumber });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
      // Send SMS here with resetToken (not shown)
    }
    return res.json({ message: 'If company exists, reset link sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending reset link' });
  }
});

// POST /reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) return res.status(400).json({ message: 'New password required' });

  try {
    const users = await CompanyUser.find({ resetPasswordExpires: { $gt: Date.now() } });
    let matchedUser = null;
    for (let user of users) {
      if (await bcrypt.compare(token, user.resetPasswordToken || '')) {
        matchedUser = user;
        break;
      }
    }
    if (!matchedUser) return res.status(400).json({ message: 'Invalid or expired token' });

    matchedUser.password = password;
    matchedUser.resetPasswordToken = undefined;
    matchedUser.resetPasswordExpires = undefined;
    await matchedUser.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// PUT /update-profile (Protected)
router.put('/update-profile', auth, async (req, res) => {
  const { companyName, companyType, address, city, state, password } = req.body;
  try {
    const user = await CompanyUser.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Company not found' });

    if (companyName) user.companyName = companyName;
    if (companyType) user.companyType = companyType;
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;
    if (password) user.password = password;
    
    await user.save();

    return res.json({ 
      message: 'Profile updated', 
      user: { 
        id: user._id, 
        companyName: user.companyName,
        companyType: user.companyType,
        registrationNumber: user.registrationNumber,
        mobileNumber: user.mobileNumber,
        address: user.address,
        city: user.city,
        state: user.state
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;