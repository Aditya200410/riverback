const mongoose = require('mongoose');

const securityMemberSchema = new mongoose.Schema({
    idNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid mobile number!`
        }
    },
    phase: {
        type: String,
        required: true,
        trim: true
    },
    aadharPhoto: {
        type: String,
        required: false
    },
    photo: {
        type: String,
        required: false
    },
    bankDetails: {
        accountNumber: {
            type: String,
            required: false,
            trim: true
        },
        ifscCode: {
            type: String,
            required: false,
            trim: true
        },
        bankName: {
            type: String,
            required: false,
            trim: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add error handling for the model
securityMemberSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new Error('Duplicate key error'));
    } else {
        next(error);
    }
});

const SecurityMember = mongoose.model('SecurityMember', securityMemberSchema);

module.exports = SecurityMember; 