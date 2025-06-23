const SecurityUser = require('../models/SecurityUser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Get all security users
exports.getAllSecurityUsers = async (req, res) => {
  try {
    const securityUsers = await SecurityUser.find().select('-password -resetPasswordToken -resetPasswordExpires');
    const baseUrl = req.protocol + '://' + req.get('host');
    const usersWithUrls = securityUsers.map(user => {
      const userObj = user.toObject();
      if (userObj.profilePicture) {
        userObj.profilePicture = `${baseUrl}/uploads/security-users/${userObj.profilePicture}`;
      }
      return userObj;
    });
    res.status(200).json({
      success: true,
      data: usersWithUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    });
  }
};

// Get single security user by ID
exports.getSecurityUserById = async (req, res) => {
  try {
    const securityUser = await SecurityUser.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!securityUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Security user not found'
        }
      });
    }
    const baseUrl = req.protocol + '://' + req.get('host');
    const userObj = securityUser.toObject();
    if (userObj.profilePicture) {
      userObj.profilePicture = `${baseUrl}/uploads/security-users/${userObj.profilePicture}`;
    }
    res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    });
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
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
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
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Security user not found'
        }
      });
    }
    res.status(200).json({
      success: true,
      data: securityUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
};

// Delete security user
exports.deleteSecurityUser = async (req, res) => {
  try {
    const securityUser = await SecurityUser.findByIdAndDelete(req.params.id);
    if (!securityUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Security user not found'
        }
      });
    }
    res.status(200).json({
      success: true,
      message: 'Security user deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    });
  }
};

// Login security user
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    
    // Find user by mobile number
    const securityUser = await SecurityUser.findOne({ mobile });
    if (!securityUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials'
        }
      });
    }

    // Compare password
    const isMatch = await securityUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials'
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: securityUser._id, role: 'security' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: securityUser._id,
          name: securityUser.name,
          mobile: securityUser.mobile,
          aadhar: securityUser.aadhar,
          securityCompany: securityUser.securityCompany,
          hasProfilePicture: !!securityUser.profilePicture
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      }
    });
  }
};

// Example error handling
if (error.response.data.field) {
  // Show error message next to the specific field
  setFieldError(error.response.data.field, error.response.data.message);
} else if (error.response.data.fields) {
  // Show errors for multiple fields
  error.response.data.fields.forEach(field => {
    setFieldError(field, `${field} is required`);
  });
} 