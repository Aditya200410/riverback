const FishType = require('../models/FishType');

// Get all active fish types
exports.getAllFishTypes = async () => {
  try {
    return await FishType.find({ status: 'active' });
  } catch (err) {
    console.error('Error in getAllFishTypes:', err);
    throw err;
  }
};

// Get fish type by ID
exports.getFishTypeById = async (id) => {
  try {
    return await FishType.findOne({ _id: id, status: 'active' });
  } catch (err) {
    console.error('Error in getFishTypeById:', err);
    throw err;
  }
};

// Create new fish type
exports.createFishType = async (fishTypeData) => {
  try {
    console.log('Controller received data:', fishTypeData);
    
    const fishType = new FishType({
      name: fishTypeData.name || '',
      description: fishTypeData.description || '',
      pricePerKg: fishTypeData.pricePerKg || 0,
      status: 'active'
    });

    console.log('FishType object before save:', fishType);

    const savedFishType = await fishType.save();
    console.log('Saved fish type:', savedFishType);
    
    return savedFishType;
  } catch (err) {
    console.error('Error in createFishType:', err);
    throw err;
  }
};

// Update fish type
exports.updateFishType = async (id, updateData) => {
  try {
    return await FishType.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
  } catch (err) {
    console.error('Error in updateFishType:', err);
    throw err;
  }
};

// Delete fish type (soft delete)
exports.deleteFishType = async (id) => {
  try {
    return await FishType.findByIdAndUpdate(
      id,
      { $set: { status: 'deleted' } },
      { new: true }
    );
  } catch (err) {
    console.error('Error in deleteFishType:', err);
    throw err;
  }
}; 