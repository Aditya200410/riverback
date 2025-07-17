const FishType = require('../models/FishType');

// Get all active fish types
exports.getAllFishTypes = async () => {
  try {
    const fishTypes = await FishType.find({ status: 'active' }).sort({ name: 1 });
    return fishTypes;
  } catch (err) {
    console.error('Error in getAllFishTypes:', err);
    throw err;
  }
};

// Get fish type by ID
exports.getFishTypeById = async (id) => {
  try {
    // Validate MongoDB ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid fish type ID format');
    }

    const fishType = await FishType.findOne({ _id: id, status: 'active' });
    return fishType;
  } catch (err) {
    console.error('Error in getFishTypeById:', err);
    throw err;
  }
};

// Create new fish type
exports.createFishType = async (fishTypeData) => {
  try {
    console.log('Controller received data:', fishTypeData);
    
    // Validate required fields
    if (!fishTypeData.name || fishTypeData.name.trim() === '') {
      throw new Error('Fish type name is required');
    }

    // Check for duplicate name
    const existingFishType = await FishType.findOne({ 
      name: fishTypeData.name.trim(), 
      status: 'active' 
    });

    if (existingFishType) {
      const error = new Error('A fish type with this name already exists');
      error.code = 11000; // MongoDB duplicate key error code
      throw error;
    }

    const fishType = new FishType({
      name: fishTypeData.name.trim(),
      description: fishTypeData.description ? fishTypeData.description.trim() : '',
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
    // Validate MongoDB ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid fish type ID format');
    }

    // Check if fish type exists and is active
    const existingFishType = await FishType.findOne({ _id: id, status: 'active' });
    if (!existingFishType) {
      return null; // Fish type not found
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name.trim() !== '') {
      const duplicateFishType = await FishType.findOne({ 
        name: updateData.name.trim(), 
        status: 'active',
        _id: { $ne: id } // Exclude current fish type
      });

      if (duplicateFishType) {
        const error = new Error('A fish type with this name already exists');
        error.code = 11000; // MongoDB duplicate key error code
        throw error;
      }
    }

    // Clean and prepare update data
    const cleanUpdateData = {};
    if (updateData.name !== undefined) {
      cleanUpdateData.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
      cleanUpdateData.description = updateData.description.trim();
    }
    if (updateData.pricePerKg !== undefined) {
      cleanUpdateData.pricePerKg = Number(updateData.pricePerKg);
    }

    const updatedFishType = await FishType.findByIdAndUpdate(
      id,
      { $set: cleanUpdateData },
      { new: true, runValidators: true }
    );

    return updatedFishType;
  } catch (err) {
    console.error('Error in updateFishType:', err);
    throw err;
  }
};

// Delete fish type (soft delete)
exports.deleteFishType = async (id) => {
  try {
    // Validate MongoDB ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid fish type ID format');
    }

    // Check if fish type exists and is active
    const existingFishType = await FishType.findOne({ _id: id, status: 'active' });
    if (!existingFishType) {
      return null; // Fish type not found
    }

    const deletedFishType = await FishType.findByIdAndUpdate(
      id,
      { $set: { status: 'deleted' } },
      { new: true }
    );

    return deletedFishType;
  } catch (err) {
    console.error('Error in deleteFishType:', err);
    throw err;
  }
};

// Bulk add fish types
exports.bulkAddFishTypes = async (fishTypesArray) => {
  try {
    if (!Array.isArray(fishTypesArray) || fishTypesArray.length === 0) {
      throw new Error('Fish types array is required and cannot be empty');
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < fishTypesArray.length; i++) {
      const fishTypeData = fishTypesArray[i];
      
      try {
        // Validate required fields
        if (!fishTypeData.name || fishTypeData.name.trim() === '') {
          errors.push({ index: i, error: 'Fish type name is required' });
          continue;
        }

        // Check for duplicate name
        const existing = await FishType.findOne({ 
          name: fishTypeData.name.trim(), 
          status: 'active' 
        });

        if (existing) {
          // Return existing fish type instead of creating duplicate
          results.push(existing);
          continue;
        }

        const fishType = new FishType({
          name: fishTypeData.name.trim(),
          description: fishTypeData.description ? fishTypeData.description.trim() : '',
          pricePerKg: fishTypeData.pricePerKg || 0,
          status: 'active'
        });

        const saved = await fishType.save();
        results.push(saved);
      } catch (itemError) {
        console.error(`Error processing fish type at index ${i}:`, itemError);
        errors.push({ index: i, error: itemError.message });
      }
    }

    // If there were errors, include them in the response
    if (errors.length > 0) {
      const error = new Error('Some fish types could not be processed');
      error.errors = errors;
      error.results = results;
      throw error;
    }

    return results;
  } catch (err) {
    console.error('Error in bulkAddFishTypes:', err);
    throw err;
  }
};

// Get fish types by name (for search functionality)
exports.searchFishTypes = async (searchQuery) => {
  try {
    if (!searchQuery || searchQuery.trim() === '') {
      throw new Error('Search query is required');
    }

    const fishTypes = await FishType.find({
      name: { $regex: searchQuery.trim(), $options: 'i' },
      status: 'active'
    }).sort({ name: 1 });

    return fishTypes;
  } catch (err) {
    console.error('Error in searchFishTypes:', err);
    throw err;
  }
};

// Get fish type count
exports.getFishTypeCount = async () => {
  try {
    const count = await FishType.countDocuments({ status: 'active' });
    return count;
  } catch (err) {
    console.error('Error in getFishTypeCount:', err);
    throw err;
  }
};
