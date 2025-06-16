const Sikari = require('../models/Sikari');

// Get all sikaris
const getAllSikaris = async () => {
    try {
        return await Sikari.find({ status: 'active' })
            .sort({ dateOfJoining: -1 });
    } catch (error) {
        console.error('Error in getAllSikaris:', error);
        throw error;
    }
};

// Get sikari by ID
const getSikariById = async (sikariId) => {
    try {
        return await Sikari.findOne({ _id: sikariId, status: 'active' });
    } catch (error) {
        console.error('Error in getSikariById:', error);
        throw error;
    }
};

// Create new sikari
const createSikari = async (sikariData) => {
    try {
        const sikari = new Sikari({
            ...sikariData,
            status: 'active'
        });
        return await sikari.save();
    } catch (error) {
        console.error('Error in createSikari:', error);
        throw error;
    }
};

// Update sikari
const updateSikari = async (sikariId, updateData) => {
    try {
        return await Sikari.findOneAndUpdate(
            { _id: sikariId, status: 'active' },
            { $set: updateData },
            { new: true, runValidators: true }
        );
    } catch (error) {
        console.error('Error in updateSikari:', error);
        throw error;
    }
};

// Delete sikari (soft delete)
const deleteSikari = async (sikariId) => {
    try {
        return await Sikari.findOneAndUpdate(
            { _id: sikariId, status: 'active' },
            { $set: { status: 'deleted' } },
            { new: true }
        );
    } catch (error) {
        console.error('Error in deleteSikari:', error);
        throw error;
    }
};

module.exports = {
    getAllSikaris,
    getSikariById,
    createSikari,
    updateSikari,
    deleteSikari
}; 