const mongoose = require('mongoose');

const fishSchema = new mongoose.Schema({
  fishName: { type: String, required: true },
  fishRate: { type: Number, required: true },
  fishWeight: { type: Number, required: true },
  pricePerKg: { type: Number, required: true }
}, { _id: false });

const collectionSchema = new mongoose.Schema({
  sikahriName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  fishes: [fishSchema],
  totalRupees: { type: Number, required: true },
  netRupees: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Collection', collectionSchema); 