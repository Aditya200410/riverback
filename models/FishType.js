const mongoose = require('mongoose');

const fishTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  pricePerKg: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Drop all indexes
fishTypeSchema.index({ name: 1 }, { unique: false });

const FishType = mongoose.model('FishType', fishTypeSchema);

// Drop existing indexes
FishType.collection.dropIndexes().catch(err => {
  console.log('No indexes to drop or error dropping indexes:', err);
});

module.exports = FishType; 