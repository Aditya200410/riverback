const MoneyHandle = require('../models/MoneyHandle');

// Get all money transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await MoneyHandle.find({ status: 'active' });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await MoneyHandle.findOne({ _id: req.params.id, status: 'active' });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const transaction = new MoneyHandle(req.body);
    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await MoneyHandle.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete transaction (soft delete)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await MoneyHandle.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'deleted' },
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 