const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SecurityMember = require('../models/SecurityMember');
const { generateFileUrl } = require('../utils/urlGenerator');
const { addSecurityMember } = require('../controllers/securityMemberController');

// Test route to check if the router is working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Security members route is working'
    });
});

// Health check route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Security members health check passed',
        timestamp: new Date().toISOString()
    });
});

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
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// Add new security member with multiple file uploads
router.post('/add', upload.fields([
    { name: 'aadharPhoto', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), addSecurityMember);

// Get all security members
router.get('/', async (req, res) => {
    try {
        console.log('Fetching security members...');
        
        // Check if SecurityMember model is properly defined
        if (!SecurityMember) {
            throw new Error('SecurityMember model is not defined');
        }
        
        const members = await SecurityMember.find().sort({ createdAt: -1 });
        console.log(`Found ${members.length} security members`);
        
        const baseUrl = req.protocol + '://' + req.get('host');
        const membersWithUrls = members.map(member => {
            try {
                // Convert to plain object safely
                const memberObj = member.toObject ? member.toObject() : member;
                
                // Add full URLs for photos
                return {
                    ...memberObj,
                    aadharPhoto: memberObj.aadharPhoto ? `${baseUrl}/${memberObj.aadharPhoto}` : null,
                    photo: memberObj.photo ? `${baseUrl}/${memberObj.photo}` : null
                };
            } catch (mapError) {
                console.error('Error mapping member:', mapError);
                // Return basic member data if mapping fails
                return {
                    _id: member._id,
                    idNumber: member.idNumber,
                    name: member.name,
                    address: member.address,
                    mobile: member.mobile,
                    phase: member.phase,
                    isActive: member.isActive,
                    createdAt: member.createdAt,
                    updatedAt: member.updatedAt,
                    aadharPhoto: null,
                    photo: null
                };
            }
        });
        
        res.status(200).json({
            success: true,
            data: membersWithUrls
        });
    } catch (error) {
        console.error('Error fetching security members:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching security members: ' + error.message
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

        const baseUrl = req.protocol + '://' + req.get('host');
        res.status(200).json({
            success: true,
            data: {
                ...member.toObject(),
                aadharPhoto: member.aadharPhoto ? `${baseUrl}/${member.aadharPhoto}` : null,
                photo: member.photo ? `${baseUrl}/${member.photo}` : null
            }
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