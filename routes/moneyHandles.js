const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/moneyHandleController');

// Get all transactions
router.get('/', auth(['company']), getAllTransactions);

// Get transaction by ID
router.get('/:id', auth(['company']), getTransactionById);

// Create new transaction
router.post('/add', auth(['company']), createTransaction);

// Update transaction
router.put('/update/:id', auth(['company']), updateTransaction);

// Delete transaction
router.delete('/delete/:id', auth(['company']), deleteTransaction);

module.exports = router; 