const express = require('express');
const router = express.Router();
const Phase = require('../models/Phase');

// Add a new phase
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Phase name is required'
                }
            });
        }

        const phase = new Phase({ name });
        await phase.save();

        res.status(201).json({
            success: true,
            message: 'Phase added successfully',
            data: phase
        });
    } catch (error) {
        console.error('Error adding phase:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error adding phase'
            }
        });
    }
});

// Get all phases
router.get('/', async (req, res) => {
    try {
        const phases = await Phase.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: phases
        });
    } catch (error) {
        console.error('Error fetching phases:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error fetching phases'
            }
        });
    }
});

module.exports = router; 