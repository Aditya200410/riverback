const Sikari = require('../models/Sikari');

// Get all sikaris
exports.getAllSikaris = async (req, res) => {
  try {
    const sikaris = await Sikari.find({ status: 'active' });
    res.status(200).json(sikaris);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single sikari by ID
exports.getSikariById = async (req, res) => {
  try {
    const sikari = await Sikari.findOne({ _id: req.params.id, status: 'active' });
    if (!sikari) {
      return res.status(404).json({ message: 'Sikari not found' });
    }
    res.status(200).json(sikari);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new sikari
exports.createSikari = async (req, res) => {
  try {
    const sikari = new Sikari(req.body);
    const newSikari = await sikari.save();
    res.status(201).json(newSikari);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update sikari
exports.updateSikari = async (req, res) => {
  try {
    const sikari = await Sikari.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!sikari) {
      return res.status(404).json({ message: 'Sikari not found' });
    }
    res.status(200).json(sikari);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete sikari (soft delete)
exports.deleteSikari = async (req, res) => {
  try {
    const sikari = await Sikari.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'deleted' },
      { new: true }
    );
    if (!sikari) {
      return res.status(404).json({ message: 'Sikari not found' });
    }
    res.status(200).json({ message: 'Sikari deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 