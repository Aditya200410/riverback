const mongoose = require('mongoose');

const companyPaperSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    default: 'application/pdf'
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyUser'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyUser'
  },
  companyName: {
    type: String,
    default: 'Unknown Company',
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'other',
    enum: ['legal', 'financial', 'contract', 'other']
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CompanyPaper', companyPaperSchema); 