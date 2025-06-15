const SecurityUser = require('../models/SecurityUser');
const jwt = require('jsonwebtoken');

// Get all security users
exports.getAllSecurityUsers = async (req, res) => {
  try {
    const securityUsers = await SecurityUser.find().select('-password -resetPasswordToken -resetPasswordExpires');
    res.status(200).json(securityUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single security user by ID
exports.getSecurityUserById = async (req, res) => {
  try {
    const securityUser = await SecurityUser.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!securityUser) {
      return res.status(404).json({ message: 'Security user not found' });
    }
    res.status(200).json(securityUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new security user
exports.createSecurityUser = async (req, res) => {
  try {
    const securityUser = new SecurityUser(req.body);
    const newSecurityUser = await securityUser.save();
    const userResponse = newSecurityUser.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update security user
exports.updateSecurityUser = async (req, res) => {
  try {
    const securityUser = await SecurityUser.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!securityUser) {
      return res.status(404).json({ message: 'Security user not found' });
    }
    res.status(200).json(securityUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete security user
exports.deleteSecurityUser = async (req, res) => {
  try {
    const securityUser = await SecurityUser.findByIdAndDelete(req.params.id);
    if (!securityUser) {
      return res.status(404).json({ message: 'Security user not found' });
    }
    res.status(200).json({ message: 'Security user deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login security user
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    
    // Find user by mobile number
    const securityUser = await SecurityUser.findOne({ mobileNumber });
    if (!securityUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await securityUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: securityUser._id, role: 'security' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: securityUser._id,
        securityName: securityUser.securityName,
        phaseName: securityUser.phaseName,
        mobileNumber: securityUser.mobileNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 