const ManagerMoney = require('../models/ManagerMoney');
const Sikari = require('../models/Sikari');

// Get all money transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await ManagerMoney.find({ status: 'active' })
            .populate('sikariId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get transactions by sikari name
exports.getTransactionsBySikari = async (req, res) => {
    try {
        const sikariName = req.query.sikariName;
        const sikari = await Sikari.findOne({ name: sikariName, status: 'active' });
        
        if (!sikari) {
            return res.status(404).json({ message: 'Sikari not found' });
        }

        const transactions = await ManagerMoney.find({ 
            sikariId: sikari._id,
            status: 'active' 
        }).sort({ createdAt: -1 });

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { sikariName, type, amount, description, paymentMode } = req.body;

        // Find sikari by name
        const sikari = await Sikari.findOne({ name: sikariName, status: 'active' });
        if (!sikari) {
            return res.status(404).json({ message: 'Sikari not found' });
        }

        const transaction = new ManagerMoney({
            sikariId: sikari._id,
            type,
            amount,
            description,
            paymentMode,
            status: 'active'
        });

        const newTransaction = await transaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await ManagerMoney.findOneAndUpdate(
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
        const transaction = await ManagerMoney.findOneAndUpdate(
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