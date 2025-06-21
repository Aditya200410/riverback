const express = require('express');
const router = express.Router();
const MoneyHandle = require('../models/MoneyHandle');
const { auth } = require('../middleware/auth');
const {
    getAllTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/moneyHandleController');

// Get all money transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
      companyId: req.user.id,
      status: 'active'
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        description: transaction.description,
        date: transaction.date
      }))
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching transactions'
      }
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await MoneyHandle.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      });
    }
    res.json({
      success: true,
      data: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        description: transaction.description,
        date: transaction.date
      }
    });
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching transaction'
      }
    });
  }
});

// Add new money transaction
router.post('/add', async (req, res) => {
  try {
    const { amount, type, toWhom, description } = req.body;

    const transaction = new MoneyHandle({
      amount,
      type,
      toWhom,
      description,
      companyId: req.user.id
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        description: transaction.description,
        date: transaction.date
      }
    });
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding transaction'
      }
    });
  }
});

// Get transactions by type (pay/take)
router.get('/type/:type', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
      companyId: req.user.id,
      type: req.params.type,
      status: 'active'
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        description: transaction.description,
        date: transaction.date
      }))
    });
  } catch (err) {
    console.error('Error fetching transactions by type:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching transactions by type'
      }
    });
  }
});

// Get transactions by person
router.get('/person/:toWhom', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
      companyId: req.user.id,
      toWhom: req.params.toWhom,
      status: 'active'
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        description: transaction.description,
        date: transaction.date
      }))
    });
  } catch (err) {
    console.error('Error fetching transactions by person:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching transactions by person'
      }
    });
  }
});

// Update transaction
router.put('/update/:id', async (req, res) => {
  try {
    const transaction = await MoneyHandle.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      });
    }
    const { amount, type, toWhom, description } = req.body;
    transaction.amount = amount;
    transaction.type = type;
    transaction.toWhom = toWhom;
    transaction.description = description;
    await transaction.save();
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        description: transaction.description,
        date: transaction.date
      }
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error updating transaction'
      }
    });
  }
});

// Delete transaction
router.delete('/delete/:id', async (req, res) => {
  try {
    const transaction = await MoneyHandle.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found'
        }
      });
    }
    await transaction.remove();
    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error deleting transaction'
      }
    });
  }
});

module.exports = router; 