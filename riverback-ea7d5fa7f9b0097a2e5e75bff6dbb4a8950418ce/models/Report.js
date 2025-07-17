const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    notice: {
        type: String,
        required: false
    },
    photo: {
        type: String,
        required: false
    },
    video: {
        type: String,
        required: false
    },
    generatedDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Create indexes for faster queries
reportSchema.index({ shopName: 1 });
reportSchema.index({ location: 1 });
reportSchema.index({ generatedDate: 1 });
reportSchema.index({ companyId: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 