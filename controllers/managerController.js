const Manager = require('../models/Manager');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { generateOTP } = require('../utils/otpGenerator');
const { storeTempData, getTempData, removeTempData } = require('../utils/tempStorage');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get all managers
exports.getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find().select('-password -resetPasswordToken -resetPasswordExpires');
    
    // Convert profile picture paths to full URLs
    const managersWithUrls = managers.map(manager => {
      const managerObj = manager.toObject();
      if (managerObj.profilePicture) {
        managerObj.profilePicture = `${req.protocol}://${req.get('host')}/${managerObj.profilePicture}`;
      }
      return managerObj;
    });
    
    res.status(200).json({
      success: true,
      data: managersWithUrls
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

// Get single manager by ID
exports.getManagerById = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Manager not found'
        }
      });
    }
    
    // Convert profile picture path to full URL
    const managerObj = manager.toObject();
    if (managerObj.profilePicture) {
      managerObj.profilePicture = `${req.protocol}://${req.get('host')}/${managerObj.profilePicture}`;
    }
    
    res.status(200).json({
      success: true,
      data: managerObj
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

// Create new manager
exports.createManager = async (req, res) => {
  try {
    const manager = new Manager(req.body);
    const newManager = await manager.save();
    const managerResponse = newManager.toObject();
    delete managerResponse.password;
    delete managerResponse.resetPasswordToken;
    delete managerResponse.resetPasswordExpires;
    res.status(201).json({
      success: true,
      data: managerResponse
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

// Update manager
exports.updateManager = async (req, res) => {
  try {
    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Manager not found'
        }
      });
    }
    
    // Convert profile picture path to full URL
    const managerObj = manager.toObject();
    if (managerObj.profilePicture) {
      managerObj.profilePicture = `${req.protocol}://${req.get('host')}/${managerObj.profilePicture}`;
    }
    
    res.status(200).json({
      success: true,
      data: managerObj
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

// Delete manager
exports.deleteManager = async (req, res) => {
  try {
    const manager = await Manager.findByIdAndDelete(req.params.id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Manager not found'
        }
      });
    }
    res.status(200).json({
      success: true,
      message: 'Manager deleted successfully'
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

// Login
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { mobile, password } = req.body;

        // Find user
        const user = await Manager.findOne({ mobile });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid credentials'
                }
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNVERIFIED_USER',
                    message: 'Please verify your mobile number first'
                }
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
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
            { id: user._id, role: 'manager' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    aadharNumber: user.aadharNumber,
                    address: user.address,
                    isVerified: true
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Signup
exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { name, mobile, password, email, aadharNumber, address } = req.body;

        // Check if user exists
        const existingUser = await Manager.findOne({ mobile });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: 'User already exists'
                }
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store temporary data
        const tempData = {
            name,
            mobile,
            password,
            email,
            aadharNumber,
            address,
            otp,
            otpExpiry,
            profilePicture: req.file ? req.file.filename : undefined
        };

        storeTempData(mobile, tempData);

        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${mobile}: ${otp}`);
        }

        res.status(201).json({
            success: true,
            message: 'OTP sent successfully. Please verify your mobile number.',
            data: {
                mobile,
                tempId: Date.now().toString() // Temporary ID for reference
            }
        });
    } catch (error) {
        next(error);
    }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const { mobile, otp } = req.body;

        // Get temporary data
        const tempData = getTempData(mobile);
        if (!tempData) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'No signup data found. Please signup again.'
                }
            });
        }

        // Verify OTP
        if (otp !== tempData.otp) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OTP',
                    message: 'Invalid OTP'
                }
            });
        }

        if (tempData.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'OTP_EXPIRED',
                    message: 'OTP has expired'
                }
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempData.password, salt);

        // Create user in database
        const user = new Manager({
            name: tempData.name,
            mobile: tempData.mobile,
            password: hashedPassword,
            email: tempData.email,
            aadharNumber: tempData.aadharNumber,
            address: tempData.address,
            isVerified: true,
            profilePicture: tempData.profilePicture
        });

        await user.save();

        // Remove temporary data
        removeTempData(mobile);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: 'manager' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Mobile number verified and account created successfully',
            data: {
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    aadharNumber: user.aadharNumber,
                    address: user.address,
                    isVerified: true
                }
            }
        });
    } catch (error) {
        next(error);
    }
}; 