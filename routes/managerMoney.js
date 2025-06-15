const express = require('express');
const router = express.Router();
const managerMoneyController = require('../controllers/managerMoneyController');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Routes
router.get('/', auth, managerMoneyController.getAllTransactions);
router.get('/sikari', auth, managerMoneyController.getTransactionsBySikari);
router.post('/add', auth, managerMoneyController.createTransaction);
router.put('/update/:id', auth, managerMoneyController.updateTransaction);
router.delete('/delete/:id', auth, managerMoneyController.deleteTransaction);

module.exports = router; 