const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportType: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reportData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
reportSchema.index({ reportType: 1 });
reportSchema.index({ startDate: 1 });
reportSchema.index({ endDate: 1 });
reportSchema.index({ companyId: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 