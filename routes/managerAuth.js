const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Manager = require('../models/Manager');

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

// Validate token
router.get('/validate-token', auth, async (req, res) => {
  try {
    const manager = await Manager.findById(req.user.id).select('-password');
    if (!manager) return res.status(401).json({ message: 'Invalid manager' });

    res.json({ manager });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /send-otp
router.post('/send-otp', async (req, res) => {
  const { mobileNumber } = req.body;
  
  if (!mobileNumber) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  // Validate mobile number format (10 digits)
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: 'Mobile number must be 10 digits' });
  }

  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user exists
    let manager = await Manager.findOne({ mobileNumber });
    
    if (manager) {
      // Update existing user's OTP
      manager.otp = {
        code: otp,
        expires: otpExpiry,
        verified: false
      };
    } else {
      // Create temporary user with OTP
      manager = new Manager({
        mobileNumber,
        otp: {
          code: otp,
          expires: otpExpiry,
          verified: false
        }
      });
    }

    await manager.save();

    // TODO: Integrate with SMS service to send OTP
    // For development, we'll return the OTP in response
    return res.json({ 
      message: 'OTP sent successfully',
      otp // Remove this in production
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// POST /verify-otp
router.post('/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!mobileNumber || !otp) {
    return res.status(400).json({ message: 'Mobile number and OTP are required' });
  }

  try {
    const manager = await Manager.findOne({ 
      mobileNumber,
      'otp.code': otp,
      'otp.expires': { $gt: Date.now() }
    });

    if (!manager) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    manager.otp.verified = true;
    await manager.save();

    return res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// POST /signup
router.post('/signup', async (req, res) => {
  const {
    managerName,
    phaseName,
    mobileNumber,
    aadharNumber,
    location,
    password,
    verifyPassword
  } = req.body;
  
  // Check each field individually and provide specific error messages
  const missingFields = [];
  if (!managerName) missingFields.push('Manager Name');
  if (!phaseName) missingFields.push('Phase Name');
  if (!mobileNumber) missingFields.push('Mobile Number');
  if (!aadharNumber) missingFields.push('Aadhar Number');
  if (!location) missingFields.push('Location');
  if (!password) missingFields.push('Password');
  if (!verifyPassword) missingFields.push('Verify Password');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: 'Required fields are missing',
      missingFields: missingFields
    });
  }

  if (password !== verifyPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Validate mobile number format (10 digits)
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: 'Mobile number must be 10 digits' });
  }

  // Validate Aadhar number format (12 digits)
  if (!/^\d{12}$/.test(aadharNumber)) {
    return res.status(400).json({ message: 'Aadhar number must be 12 digits' });
  }

  try {
    const manager = await Manager.findOne({ mobileNumber });
    
    if (!manager || !manager.otp?.verified) {
      return res.status(400).json({ message: 'Please verify your mobile number with OTP first' });
    }

    if (manager.managerName) {
      return res.status(400).json({ message: 'Manager already registered' });
    }

    const existingUser = await Manager.findOne({ aadharNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Aadhar number already registered' });
    }

    // Update user with registration details
    manager.managerName = managerName;
    manager.phaseName = phaseName;
    manager.aadharNumber = aadharNumber;
    manager.location = location;
    manager.password = password;
    manager.otp = undefined; // Clear OTP after successful registration
    
    await manager.save();

    const token = jwt.sign(
      { 
        id: manager._id, 
        mobileNumber: manager.mobileNumber,
        phaseName: manager.phaseName 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Manager registered successfully',
      token,
      manager: {
        id: manager._id,
        managerName,
        phaseName,
        mobileNumber,
        location
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Manager registration error' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { mobileNumber, password, phaseName } = req.body;
  
  // Check required fields
  const missingFields = [];
  if (!mobileNumber) missingFields.push('Mobile Number');
  if (!password) missingFields.push('Password');
  if (!phaseName) missingFields.push('Phase Name');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: 'Required fields are missing',
      missingFields: missingFields
    });
  }

  // Validate mobile number format
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: 'Mobile number must be 10 digits' });
  }

  try {
    const manager = await Manager.findOne({ 
      mobileNumber,
      phaseName // Add phase name to the query
    });

    if (!manager || !(await manager.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials or phase' });
    }

    const token = jwt.sign(
      { 
        id: manager._id, 
        mobileNumber: manager.mobileNumber,
        phaseName: manager.phaseName 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      manager: {
        id: manager._id,
        managerName: manager.managerName,
        phaseName: manager.phaseName,
        mobileNumber: manager.mobileNumber,
        location: manager.location
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
    const manager = await Manager.findOne({ mobileNumber });
    if (manager) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      manager.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      manager.resetPasswordExpires = Date.now() + 3600000;
      await manager.save();
      // Send SMS here with resetToken (not shown)
    }
    return res.json({ message: 'If manager exists, reset link sent' });
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
    const managers = await Manager.find({ resetPasswordExpires: { $gt: Date.now() } });
    let matchedManager = null;
    for (let manager of managers) {
      if (await bcrypt.compare(token, manager.resetPasswordToken || '')) {
        matchedManager = manager;
        break;
      }
    }
    if (!matchedManager) return res.status(400).json({ message: 'Invalid or expired token' });

    matchedManager.password = password;
    matchedManager.resetPasswordToken = undefined;
    matchedManager.resetPasswordExpires = undefined;
    await matchedManager.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// PUT /update-profile (Protected)
router.put('/update-profile', auth, async (req, res) => {
  const { managerName, phaseName, location, password } = req.body;
  try {
    const manager = await Manager.findById(req.user.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });

    if (managerName) manager.managerName = managerName;
    if (phaseName) manager.phaseName = phaseName;
    if (location) manager.location = location;
    if (password) manager.password = password;
    
    await manager.save();

    return res.json({ 
      message: 'Profile updated', 
      manager: { 
        id: manager._id, 
        managerName: manager.managerName,
        phaseName: manager.phaseName,
        mobileNumber: manager.mobileNumber,
        location: manager.location
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// GET /profile-picture/:id
router.get('/profile-picture/:id', async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id).select('profilePicture');
    if (!manager || !manager.profilePicture) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.set('Content-Type', manager.profilePicture.contentType);
    res.send(manager.profilePicture.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile picture' });
  }
});

module.exports = router; 