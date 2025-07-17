const mongoose = require('mongoose');

const managerMoneySchema = new mongoose.Schema({
    sikariId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sikari',
        required: true
    },
    type: {
        type: String,
        enum: ['pay', 'lend'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'online'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ManagerMoney', managerMoneySchema); 