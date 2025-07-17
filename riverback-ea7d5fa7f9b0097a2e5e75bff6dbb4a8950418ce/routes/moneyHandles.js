const express = require('express');
const router = express.Router();
const MoneyHandle = require('../models/MoneyHandle');
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
      status: 'active'
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
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
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
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
    console.log('Received new transaction request:', req.body);
    
    const { 
      amount, 
      type, 
      toWhom, 
      sendTo, 
      receiverName, 
      receiverId, 
      pay, 
      received, 
      description,
      username 
    } = req.body;

    // Validate required fields
    if (!amount || !type || !toWhom || !sendTo || !receiverName || !description || !username) {
      console.log('Missing required fields:', { amount, type, toWhom, sendTo, receiverName, description, username });
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Required fields: amount, type, toWhom, sendTo, receiverName, description, username'
        }
      });
    }

    // Validate amount is a positive number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number'
        }
      });
    }

    // Validate type is either 'pay' or 'take'
    if (!['pay', 'take'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "pay" or "take"'
        }
      });
    }

    // Validate sendTo is one of the allowed values
    if (!['Company', 'Manager', 'Sikari', 'Security'].includes(sendTo)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEND_TO',
          message: 'SendTo must be one of: Company, Manager, Sikari, Security'
        }
      });
    }

    // Validate pay and received are boolean values
    const payBool = pay === true || pay === 'true';
    const receivedBool = received === true || received === 'true';

    const transaction = new MoneyHandle({
      amount: amountNum,
      type,
      toWhom,
      sendTo,
      receiverName,
      receiverId: receiverId || null,
      pay: payBool,
      received: receivedBool,
      description,
      username,
      companyId: null
    });

    await transaction.save();

    // Prepare transaction data for response and WebSocket
    const transactionData = {
      id: transaction._id,
      amount: transaction.amount,
      type: transaction.type,
      toWhom: transaction.toWhom,
      sendTo: transaction.sendTo,
      receiverName: transaction.receiverName,
      receiverId: transaction.receiverId,
      pay: transaction.pay,
      received: transaction.received,
      description: transaction.description,
      username: transaction.username,
      date: transaction.date
    };

    // Emit WebSocket event for real-time update
    const io = req.app.get('io');
    io.to('money-updates').emit('new-transaction', {
      type: 'ADD',
      data: transactionData
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: transactionData
    });
  } catch (err) {
    console.error('Error adding transaction:', err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors
        }
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'A transaction with these details already exists'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error adding transaction',
        details: err.message
      }
    });
  }
});

// Get transactions by type (pay/take)
router.get('/type/:type', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
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
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
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

// Get transactions by sendTo type (Company, Manager, Sikari, Security)
router.get('/sendto/:sendTo', async (req, res) => {
  try {
    const { sendTo } = req.params;
    
    // Validate sendTo parameter
    if (!['Company', 'Manager', 'Sikari', 'Security'].includes(sendTo)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEND_TO',
          message: 'SendTo must be one of: Company, Manager, Sikari, Security'
        }
      });
    }

    const transactions = await MoneyHandle.find({
      sendTo: sendTo,
      status: 'active'
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
        description: transaction.description,
        date: transaction.date
      }))
    });
  } catch (err) {
    console.error('Error fetching transactions by sendTo:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching transactions by sendTo'
      }
    });
  }
});

// Get transactions by person
router.get('/person/:toWhom', async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({
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
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
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

// Get transactions by pay/received status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status parameter
    if (!['pay', 'received'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either "pay" or "received"'
        }
      });
    }

    const query = { status: 'active' };
    if (status === 'pay') {
      query.pay = true;
    } else if (status === 'received') {
      query.received = true;
    }

    const transactions = await MoneyHandle.find(query).sort({ date: -1 });

    res.json({
      success: true,
      data: transactions.map(transaction => ({
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
        description: transaction.description,
        date: transaction.date
      }))
    });
  } catch (err) {
    console.error('Error fetching transactions by status:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error fetching transactions by status'
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
    
    const { 
      amount, 
      type, 
      toWhom, 
      sendTo, 
      receiverName, 
      receiverId, 
      pay, 
      received, 
      description 
    } = req.body;
    
    // Update fields if provided
    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (toWhom !== undefined) transaction.toWhom = toWhom;
    if (sendTo !== undefined) transaction.sendTo = sendTo;
    if (receiverName !== undefined) transaction.receiverName = receiverName;
    if (receiverId !== undefined) transaction.receiverId = receiverId;
    if (pay !== undefined) transaction.pay = pay === true || pay === 'true';
    if (received !== undefined) transaction.received = received === true || received === 'true';
    if (description !== undefined) transaction.description = description;
    
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        toWhom: transaction.toWhom,
        sendTo: transaction.sendTo,
        receiverName: transaction.receiverName,
        receiverId: transaction.receiverId,
        pay: transaction.pay,
        received: transaction.received,
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