const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SecurityMember = require('../models/SecurityMember');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/security-members';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Create a new security member
router.post('/', upload.fields([
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            idNumber,
            name,
            address,
            mobile,
            phase,
            accountNumber,
            ifscCode,
            bankName
        } = req.body;

        // Validate required fields
        if (!idNumber || !name || !address || !mobile || !phase || !accountNumber || !ifscCode || !bankName) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'All fields are required'
                }
            });
        }

        // Validate file uploads
        if (!req.files || !req.files['aadharPhoto'] || !req.files['photo']) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FILES',
                    message: 'Both aadhar photo and profile photo are required'
                }
            });
        }

        // Check if member already exists
        const existingMember = await SecurityMember.findOne({
            $or: [
                { idNumber },
                { mobile }
            ]
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MEMBER_EXISTS',
                    message: 'Member with this ID number or mobile already exists'
                }
            });
        }

        // Create new member
        const member = new SecurityMember({
            idNumber,
            name,
            address,
            mobile,
            phase,
            aadharPhoto: req.files['aadharPhoto'][0].path,
            photo: req.files['photo'][0].path,
            bankDetails: {
                accountNumber,
                ifscCode,
                bankName
            }
        });

        await member.save();

        res.status(201).json({
            success: true,
            message: 'Security member added successfully',
            data: member
        });
    } catch (error) {
        console.error('Error adding security member:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error adding security member'
            }
        });
    }
});

// Get all security members
router.get('/', async (req, res) => {
    try {
        const members = await SecurityMember.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('Error fetching security members:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching security members'
            }
        });
    }
});

// Get a single security member
router.get('/:id', async (req, res) => {
    try {
        const member = await SecurityMember.findById(req.params.id);
        
        if (!member) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MEMBER_NOT_FOUND',
                    message: 'Security member not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        console.error('Error fetching security member:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching security member'
            }
        });
    }
});

// Update a security member
router.put('/:id', upload.fields([
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            name,
            address,
            mobile,
            phase,
            accountNumber,
            ifscCode,
            bankName
        } = req.body;

        const updateData = {
            name,
            address,
            mobile,
            phase,
            bankDetails: {
                accountNumber,
                ifscCode,
                bankName
            }
        };

        // Add photo paths if new photos are uploaded
        if (req.files) {
            if (req.files['aadharPhoto']) {
                updateData.aadharPhoto = req.files['aadharPhoto'][0].path;
            }
            if (req.files['photo']) {
                updateData.photo = req.files['photo'][0].path;
            }
        }

        const member = await SecurityMember.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MEMBER_NOT_FOUND',
                    message: 'Security member not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Security member updated successfully',
            data: member
        });
    } catch (error) {
        console.error('Error updating security member:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error updating security member'
            }
        });
    }
});

// Delete a security member
router.delete('/:id', async (req, res) => {
    try {
        const member = await SecurityMember.findByIdAndDelete(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MEMBER_NOT_FOUND',
                    message: 'Security member not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Security member deleted successfully',
            data: {
                id: member._id,
                name: member.name
            }
        });
    } catch (error) {
        console.error('Error deleting security member:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error deleting security member'
            }
        });
    }
});

module.exports = router; 