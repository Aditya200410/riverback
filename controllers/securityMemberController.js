const SecurityMember = require('../models/SecurityMember');
const { validationResult } = require('express-validator');
const { generateSecurityId } = require('../utils/idGenerator');

// Add new security member
exports.addSecurityMember = async (req, res, next) => {
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

        const { name, mobile, address, phase } = req.body;

        if (!phase) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PHASE',
                    message: 'Phase is required'
                }
            });
        }

        // Check if member exists
        const existingMember = await SecurityMember.findOne({ mobile });
        if (existingMember) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MEMBER_EXISTS',
                    message: 'Security member with this mobile number already exists'
                }
            });
        }

        // Generate unique ID
        const idNumber = await generateSecurityId();

        // Generate password (first 3 letters of name + @123)
        // let passwordPrefix = name.trim().substring(0, 3);
        // if (passwordPrefix.length > 0) {
        //   passwordPrefix = passwordPrefix[0].toUpperCase() + passwordPrefix.slice(1).toLowerCase();
        // }
        // const generatedPassword = `${passwordPrefix}@123`;
        const generatedPassword = '1234';

        // Create new security member
        const securityMember = new SecurityMember({
            idNumber,
            name,
            mobile,
            address,
            phase,
            password: generatedPassword,
            aadharPhoto: req.files?.aadharPhoto?.[0]?.filename,
            photo: req.files?.photo?.[0]?.filename,
            bankDetails: req.body.bankDetails ? JSON.parse(req.body.bankDetails) : undefined
        });

        await securityMember.save();

        // Return response with generated credentials
        res.status(201).json({
            success: true,
            message: 'Security member added successfully',
            data: {
                member: {
                    _id: securityMember._id,
                    idNumber: securityMember.idNumber,
                    name: securityMember.name,
                    mobile: securityMember.mobile,
                    address: securityMember.address,
                    phase: securityMember.phase,
                    aadharPhoto: securityMember.aadharPhoto,
                    photo: securityMember.photo,
                    bankDetails: securityMember.bankDetails,
                    isActive: securityMember.isActive
                },
                credentials: {
                    phoneNumber: mobile,
                    password: generatedPassword,
                    phase: phase
                }
            }
        });
    } catch (error) {
        next(error);
    }
}; 