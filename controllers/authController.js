const CompanyUser = require('../models/CompanyUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const path = require('path');
const crypto = require('crypto');
const { generateOTP } = require('../utils/otpGenerator');
const { storeTempData, getTempData, removeTempData } = require('../utils/tempStorage');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Send OTP
exports.sendOTP = async (req, res, next) => {
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

        const { mobile } = req.body;
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Find or create user
        let user = await CompanyUser.findOne({ mobile });
        if (!user) {
            user = new CompanyUser({ mobile });
        }

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${mobile}: ${otp}`);
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                mobile,
                otpExpiry
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
        const user = new CompanyUser({
            name: tempData.name,
            mobile: tempData.mobile,
            password: hashedPassword,
            email: tempData.email,
            companyName: tempData.companyName,
            companyAddress: tempData.companyAddress,
            isVerified: true,
            profilePicture: tempData.profilePicture
        });

        await user.save();

        // Remove temporary data
        removeTempData(mobile);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: 'company' },
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
                    companyName: user.companyName,
                    companyAddress: user.companyAddress,
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

        const { name, mobile, password, email, companyName, companyAddress } = req.body;

        // Check if user exists
        const existingUser = await CompanyUser.findOne({ mobile });
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
            companyName,
            companyAddress,
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
        const user = await CompanyUser.findOne({ mobile });
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
            { 
                id: user._id,
                role: 'company',
                mobile: user.mobile
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    mobile: user.mobile,
                    email: user.email,
                    companyName: user.companyName,
                    companyAddress: user.companyAddress,
                    isVerified: true
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Profile Picture
exports.getProfilePicture = async (req, res, next) => {
    try {
        const user = await CompanyUser.findById(req.params.id);
        if (!user || !user.profilePicture) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PROFILE_PICTURE_NOT_FOUND',
                    message: 'Profile picture not found'
                }
            });
        }

        res.sendFile(path.join(__dirname, '..', 'uploads', user.profilePicture));
    } catch (error) {
        next(error);
    }
}; 