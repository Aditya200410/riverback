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
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    bankDetails: {
        accountNumber: {
            type: String,
            required: true,
            trim: true
        },
        ifscCode: {
            type: String,
            required: true,
            trim: true
        },
        bankName: {
            type: String,
            required: true,
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

const SecurityMember = mongoose.model('SecurityMember', securityMemberSchema);

module.exports = SecurityMember; 