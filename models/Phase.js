const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Phase', phaseSchema); 