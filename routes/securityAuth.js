const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const SecurityUser = require('../models/SecurityUser');
const upload = require('../middleware/upload');

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
    const securityUser = await SecurityUser.findById(req.user.id).select('-password');
    if (!securityUser) return res.status(401).json({ message: 'Invalid security user' });

    res.json({ securityUser });
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
    let securityUser = await SecurityUser.findOne({ mobileNumber });
    
    if (securityUser) {
      // Update existing user's OTP
      securityUser.otp = {
        code: otp,
        expires: otpExpiry,
        verified: false
      };
    } else {
      // Create temporary user with OTP
      securityUser = new SecurityUser({
        mobileNumber,
        otp: {
          code: otp,
          expires: otpExpiry,
          verified: false
        }
      });
    }

    await securityUser.save();

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
    const securityUser = await SecurityUser.findOne({ 
      mobileNumber,
      'otp.code': otp,
      'otp.expires': { $gt: Date.now() }
    });

    if (!securityUser) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    securityUser.otp.verified = true;
    await securityUser.save();

    return res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// POST /signup
router.post('/signup', upload.single('profilePicture'), async (req, res) => {
  const {
    securityName,
    phaseName,
    mobileNumber,
    aadharNumber,
    location,
    password,
    verifyPassword
  } = req.body;
  
  // Check each field individually and provide specific error messages
  const missingFields = [];
  if (!securityName) missingFields.push('Security Name');
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
    const securityUser = await SecurityUser.findOne({ mobileNumber });
    
    if (!securityUser || !securityUser.otp?.verified) {
      return res.status(400).json({ message: 'Please verify your mobile number with OTP first' });
    }

    if (securityUser.securityName) {
      return res.status(400).json({ message: 'Security user already registered' });
    }

    const existingUser = await SecurityUser.findOne({ aadharNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Aadhar number already registered' });
    }

    // Update user with registration details
    securityUser.securityName = securityName;
    securityUser.phaseName = phaseName;
    securityUser.aadharNumber = aadharNumber;
    securityUser.location = location;
    securityUser.password = password;
    securityUser.otp = undefined; // Clear OTP after successful registration

    // Add profile picture if uploaded
    if (req.file) {
      securityUser.profilePicture = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    await securityUser.save();

    const token = jwt.sign(
      { 
        id: securityUser._id, 
        mobileNumber: securityUser.mobileNumber,
        phaseName: securityUser.phaseName 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Security user registered successfully',
      token,
      securityUser: {
        id: securityUser._id,
        securityName,
        phaseName,
        mobileNumber,
        location,
        hasProfilePicture: !!securityUser.profilePicture
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Security user registration error' });
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
    const securityUser = await SecurityUser.findOne({ 
      mobileNumber,
      phaseName
    });

    if (!securityUser || !(await securityUser.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials or phase' });
    }

    const token = jwt.sign(
      { 
        id: securityUser._id, 
        mobileNumber: securityUser.mobileNumber,
        phaseName: securityUser.phaseName 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      securityUser: {
        id: securityUser._id,
        securityName: securityUser.securityName,
        phaseName: securityUser.phaseName,
        mobileNumber: securityUser.mobileNumber,
        location: securityUser.location
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
    const securityUser = await SecurityUser.findOne({ mobileNumber });
    if (securityUser) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      securityUser.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      securityUser.resetPasswordExpires = Date.now() + 3600000;
      await securityUser.save();
      // Send SMS here with resetToken (not shown)
    }
    return res.json({ message: 'If security user exists, reset link sent' });
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
    const securityUsers = await SecurityUser.find({ resetPasswordExpires: { $gt: Date.now() } });
    let matchedSecurityUser = null;
    for (let securityUser of securityUsers) {
      if (await bcrypt.compare(token, securityUser.resetPasswordToken || '')) {
        matchedSecurityUser = securityUser;
        break;
      }
    }
    if (!matchedSecurityUser) return res.status(400).json({ message: 'Invalid or expired token' });

    matchedSecurityUser.password = password;
    matchedSecurityUser.resetPasswordToken = undefined;
    matchedSecurityUser.resetPasswordExpires = undefined;
    await matchedSecurityUser.save();

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// PUT /update-profile (Protected)
router.put('/update-profile', auth, async (req, res) => {
  const { securityName, phaseName, location, password } = req.body;
  try {
    const securityUser = await SecurityUser.findById(req.user.id);
    if (!securityUser) return res.status(404).json({ message: 'Security user not found' });

    if (securityName) securityUser.securityName = securityName;
    if (phaseName) securityUser.phaseName = phaseName;
    if (location) securityUser.location = location;
    if (password) securityUser.password = password;
    
    await securityUser.save();

    return res.json({ 
      message: 'Profile updated', 
      securityUser: { 
        id: securityUser._id, 
        securityName: securityUser.securityName,
        phaseName: securityUser.phaseName,
        mobileNumber: securityUser.mobileNumber,
        location: securityUser.location
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
    const securityUser = await SecurityUser.findById(req.params.id).select('profilePicture');
    if (!securityUser || !securityUser.profilePicture) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    res.set('Content-Type', securityUser.profilePicture.contentType);
    res.send(securityUser.profilePicture.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile picture' });
  }
});

module.exports = router; 