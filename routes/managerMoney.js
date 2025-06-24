const express = require('express');
const router = express.Router();
const managerMoneyController = require('../controllers/managerMoneyController');

// Middleware to protect routes
const auth = (req, res, next) => {
    const userId = req.header('X-User-Id');
    if (!userId) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
    }
    req.user = { id: userId };
    next();
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