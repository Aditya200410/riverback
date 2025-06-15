const Manager = require('../models/Manager');
const jwt = require('jsonwebtoken');

// Get all managers
exports.getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find().select('-password -resetPasswordToken -resetPasswordExpires');
    res.status(200).json(managers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single manager by ID
exports.getManagerById = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.status(200).json(manager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new manager
exports.createManager = async (req, res) => {
  try {
    const manager = new Manager(req.body);
    const newManager = await manager.save();
    const managerResponse = newManager.toObject();
    delete managerResponse.password;
    delete managerResponse.resetPasswordToken;
    delete managerResponse.resetPasswordExpires;
    res.status(201).json(managerResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update manager
exports.updateManager = async (req, res) => {
  try {
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.status(200).json(manager);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete manager
exports.deleteManager = async (req, res) => {
  try {
    const manager = await Manager.findByIdAndDelete(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }
    res.status(200).json({ message: 'Manager deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login manager
exports.login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    
    // Find manager by mobile number
    const manager = await Manager.findOne({ mobileNumber });
    if (!manager) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await manager.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: manager._id, role: 'manager' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: manager._id,
        managerName: manager.managerName,
        phaseName: manager.phaseName,
        mobileNumber: manager.mobileNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 