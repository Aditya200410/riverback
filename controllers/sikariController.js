const Sikari = require('../models/Sikari');
const Collection = require('../models/Collection');

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
        // Get sikari details
        const sikari = await Sikari.findOne({ _id: sikariId, status: 'active' });
        if (!sikari) {
            return null;
        }

        // Get collection history for this sikari
        const collectionHistory = await Collection.find({ 
            sikahriName: sikari.name,
            phoneNumber: sikari.mobileNumber 
        }).sort({ createdAt: -1 });

        // Create response object with all required data
        const response = {
            sikari: sikari,
            paymentHistory: [], // Empty array for now as payment history is not implemented yet
            collectionHistory: collectionHistory
        };

        return response;
    } catch (error) {
        console.error('Error in getSikariById:', error);
        throw error;
    }
};

// Find duplicate sikari
const findDuplicateSikari = async (data) => {
    try {
        const { mobileNumber, sikariId, smargId, adharCardNumber } = data;
        console.log('Checking for duplicates with:', { mobileNumber, sikariId, smargId, adharCardNumber });
        
        const duplicate = await Sikari.findOne({
            status: 'active',
            $or: [
                { mobileNumber: mobileNumber },
                { sikariId: sikariId },
                { smargId: smargId },
                { adharCardNumber: adharCardNumber }
            ]
        });
        
        if (duplicate) {
            console.log('Duplicate found:', duplicate._id);
        } else {
            console.log('No duplicates found');
        }
        
        return duplicate;
    } catch (error) {
        console.error('Error in findDuplicateSikari:', error);
        throw error;
    }
};

// Create new sikari
const createSikari = async (sikariData) => {
    try {
        console.log('Creating sikari with data:', sikariData);
        
        const sikari = new Sikari({
            ...sikariData,
            status: 'active'
        });
        
        console.log('Sikari model created, saving...');
        const savedSikari = await sikari.save();
        console.log('Sikari saved successfully:', savedSikari._id);
        
        return savedSikari;
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
    findDuplicateSikari,
    createSikari,
    updateSikari,
    deleteSikari
}; 