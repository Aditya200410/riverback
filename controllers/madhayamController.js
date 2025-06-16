const Madhayam = require('../models/Madhayam');

// Get all active madhayams
exports.getAllMadhayams = async () => {
  try {
    return await Madhayam.find({ status: 'active' });
  } catch (err) {
    console.error('Error in getAllMadhayams:', err);
    throw err;
  }
};

// Get madhayam by ID
exports.getMadhayamById = async (id) => {
  try {
    return await Madhayam.findOne({ _id: id, status: 'active' });
  } catch (err) {
    console.error('Error in getMadhayamById:', err);
    throw err;
  }
};

// Create new madhayam
exports.createMadhayam = async (madhayamData) => {
  try {
    const madhayam = new Madhayam({
      ...madhayamData,
      status: 'active'
    });
    return await madhayam.save();
  } catch (err) {
    console.error('Error in createMadhayam:', err);
    throw err;
  }
};

// Update madhayam
exports.updateMadhayam = async (id, updateData) => {
  try {
    return await Madhayam.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  } catch (err) {
    console.error('Error in updateMadhayam:', err);
    throw err;
  }
};

// Delete madhayam (soft delete)
exports.deleteMadhayam = async (id) => {
  try {
    return await Madhayam.findByIdAndUpdate(
      id,
      { $set: { status: 'deleted' } },
      { new: true }
    );
  } catch (err) {
    console.error('Error in deleteMadhayam:', err);
    throw err;
  }
}; 