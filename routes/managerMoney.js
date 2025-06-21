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
router.get('/', async (req, res) => {
    managerMoneyController.getAllTransactions(req, res);
});
router.get('/sikari', async (req, res) => {
    managerMoneyController.getTransactionsBySikari(req, res);
});
router.post('/add', async (req, res) => {
    managerMoneyController.createTransaction(req, res);
});
router.put('/update/:id', async (req, res) => {
    managerMoneyController.updateTransaction(req, res);
});
router.delete('/delete/:id', async (req, res) => {
    managerMoneyController.deleteTransaction(req, res);
});

module.exports = router; 