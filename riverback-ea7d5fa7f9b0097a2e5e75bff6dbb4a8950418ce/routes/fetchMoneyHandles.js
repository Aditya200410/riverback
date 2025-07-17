const express = require('express');
const router = express.Router();
const MoneyHandle = require('../models/MoneyHandle');

// Middleware to protect routes
const auth = async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'NO_USER_ID',
        message: 'No user ID provided, authorization denied'
      }
    });
  }
  try {
    const user = await MoneyHandle.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'Invalid user'
        }
      });
    }
    req.user = { id: user._id };
    next();
  } catch {
    return res.status(401).json({ 
      success: false,
      error: {
        code: 'INVALID_USER',
        message: 'Invalid user'
      }
    });
  }
};

// Get all active transactions
router.get('/all', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({ status: 'active' })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        moneytaker: transaction.moneytaker,
        transactionType: transaction.transactionType,
        price: transaction.price,
        reason: transaction.reason,
        createdAt: transaction.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// Get transactions by moneytaker
router.get('/moneytaker/:type', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
      moneytaker: req.params.type,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        moneytaker: transaction.moneytaker,
        transactionType: transaction.transactionType,
        price: transaction.price,
        reason: transaction.reason,
        createdAt: transaction.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions by moneytaker'
    });
  }
});

// Get transactions by type (pay/take)
router.get('/type/:type', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
      transactionType: req.params.type,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        moneytaker: transaction.moneytaker,
        transactionType: transaction.transactionType,
        price: transaction.price,
        reason: transaction.reason,
        createdAt: transaction.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions by type'
    });
  }
});

// Get transactions by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const transactions = await MoneyHandle.find({
      status: 'active',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        moneytaker: transaction.moneytaker,
        transactionType: transaction.transactionType,
        price: transaction.price,
        reason: transaction.reason,
        createdAt: transaction.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions by date range'
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await MoneyHandle.findOne({
      _id: req.params.id,
      status: 'active'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        moneytaker: transaction.moneytaker,
        transactionType: transaction.transactionType,
        price: transaction.price,
        reason: transaction.reason,
        createdAt: transaction.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction'
    });
  }
});

module.exports = router; 