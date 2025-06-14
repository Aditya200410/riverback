const express = require('express');
const router = express.Router();
const MoneyHandle = require('../models/MoneyHandle');
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

// Add new money handle transaction
router.post('/add', auth, async (req, res) => {
  try {
    const { moneytaker, transactionType, price, reason } = req.body;

    if (!moneytaker || !transactionType || !price || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const moneyHandle = new MoneyHandle({
      moneytaker,
      transactionType,
      price,
      reason
    });

    await moneyHandle.save();

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction: {
        id: moneyHandle._id,
        moneytaker: moneyHandle.moneytaker,
        transactionType: moneyHandle.transactionType,
        price: moneyHandle.price,
        reason: moneyHandle.reason,
        createdAt: moneyHandle.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error adding transaction'
    });
  }
});

// Update transaction
router.put('/update/:id', auth, async (req, res) => {
  try {
    const { price, reason } = req.body;

    if (!price || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Price and reason are required'
      });
    }

    const transaction = await MoneyHandle.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: 'active'
      },
      { 
        price,
        reason
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
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
      message: 'Error updating transaction'
    });
  }
});

// Delete transaction (soft delete)
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const transaction = await MoneyHandle.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: 'active'
      },
      { status: 'deleted' },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction'
    });
  }
});

module.exports = router; 