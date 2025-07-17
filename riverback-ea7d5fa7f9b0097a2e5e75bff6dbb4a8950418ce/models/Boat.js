const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    boatPhoto: {
        type: String,
        required: true
    },
    registrationPhoto: {
        type: String,
        required: true
    },
    insurancePhoto: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Create index for faster queries
boatSchema.index({ companyId: 1, status: 1 });
boatSchema.index({ registrationNumber: 1 }, { unique: true });

const Boat = mongoose.model('Boat', boatSchema);

module.exports = Boat; 