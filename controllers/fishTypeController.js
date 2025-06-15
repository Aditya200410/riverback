const FishType = require('../models/FishType');

// Get all fish types
exports.getAllFishTypes = async (req, res) => {
  try {
    const fishTypes = await FishType.find({ status: 'active' });
    res.status(200).json(fishTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single fish type by ID
exports.getFishTypeById = async (req, res) => {
  try {
    const fishType = await FishType.findOne({ _id: req.params.id, status: 'active' });
    if (!fishType) {
      return res.status(404).json({ message: 'Fish type not found' });
    }
    res.status(200).json(fishType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new fish type
exports.createFishType = async (req, res) => {
  try {
    const fishType = new FishType(req.body);
    const newFishType = await fishType.save();
    res.status(201).json(newFishType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update fish type
exports.updateFishType = async (req, res) => {
  try {
    const fishType = await FishType.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      req.body,
      { new: true, runValidators: true }
    );
    if (!fishType) {
      return res.status(404).json({ message: 'Fish type not found' });
    }
    res.status(200).json(fishType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete fish type (soft delete)
exports.deleteFishType = async (req, res) => {
  try {
    const fishType = await FishType.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'deleted' },
      { new: true }
    );
    if (!fishType) {
      return res.status(404).json({ message: 'Fish type not found' });
    }
    res.status(200).json({ message: 'Fish type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 