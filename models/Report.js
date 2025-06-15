const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true
    },
    notice: {
        type: String,
        required: true
    },
    photo: {
        type: String, // URL or path to the photo
        required: false
    },
    video: {
        type: String, // URL or path to the video
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema); 