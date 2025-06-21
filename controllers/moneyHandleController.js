const MoneyHandle = require('../models/MoneyHandle');

// Get all transactions for a company
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await MoneyHandle.find({
            status: 'active'
        }).sort({ date: -1 });

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Error getting transactions'
        });
    }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await MoneyHandle.findOne({
            _id: req.params.id,
            status: 'active'
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error getting transaction:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Error getting transaction'
        });
    }
};

// Create new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { amount, type, description } = req.body;

        const transaction = new MoneyHandle({
            amount,
            type,
            description,
            companyId: null
        });

        await transaction.save();

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Error creating transaction'
        });
    }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
    try {
        const { amount, type, description } = req.body;

        const transaction = await MoneyHandle.findOneAndUpdate(
            {
                _id: req.params.id,
                status: 'active'
            },
            {
                amount,
                type,
                description
            },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'NOT_FOUND',
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Error updating transaction'
        });
    }
};

// Delete transaction (soft delete)
exports.deleteTransaction = async (req, res) => {
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
                error: 'NOT_FOUND',
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Error deleting transaction'
        });
    }
}; 