const Sikari = require('../models/Sikari');
const Collection = require('../models/Collection');

// Get all sikaris
const getAllSikaris = async () => {
    try {
        const sikaris = await Sikari.find({ status: 'active' })
            .sort({ dateOfJoining: -1 })
            .select({
                sikariId: 1,
                sikariName: 1,
                mobile: 1,
                workAddress: 1,
                homeAddress: 1,
                dateOfJoining: 1,
                smargId: 1,
                adharCardNumber: 1,
                madhayamName: 1,
                boatNumber: 1,
                position: 1,
                profilePhoto: 1
            });
        
        return sikaris;
    } catch (error) {
        console.error('Error in getAllSikaris:', error);
        throw error;
    }
};

// Get sikari by ID
const getSikariById = async (sikariId) => {
    try {
        const sikari = await Sikari.findOne({ _id: sikariId, status: 'active' });
        if (!sikari) {
            return null;
        }

        const collectionHistory = await Collection.find({ 
            sikahriName: sikari.name,
            phoneNumber: sikari.mobileNumber 
        }).sort({ createdAt: -1 });

        const response = {
            sikari: {
                ...sikari.toObject(),
                addresses: {
                    home: sikari.homeAddress || '',
                    work: sikari.workAddress || ''
                }
            },
            paymentHistory: [],
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
        const { mobileNumber, sikariId, adharCardNumber } = data;
        
        const duplicate = await Sikari.findOne({
            status: 'active',
            $or: [
                { mobileNumber: mobileNumber },
                { sikariId: sikariId },
                { adharCardNumber: adharCardNumber }
            ]
        });
        
        return duplicate;
    } catch (error) {
        console.error('Error in findDuplicateSikari:', error);
        throw error;
    }
};

// Create new sikari
const createSikari = async (sikariData) => {
    try {
        const sikari = new Sikari({
            ...sikariData,
            password: sikariData.password || '1234',
            workAddress: sikariData.workAddress || '',
            homeAddress: sikariData.homeAddress || '',
            status: 'active'
        });
        
        const savedSikari = await sikari.save();
        
        return {
            ...savedSikari.toObject(),
            addresses: {
                home: savedSikari.homeAddress || '',
                work: savedSikari.workAddress || ''
            }
        };
    } catch (error) {
        console.error('Error in createSikari:', error);
        throw error;
    }
};

// Update sikari
const updateSikari = async (sikariId, updateData) => {
    try {
        const updatedSikari = await Sikari.findOneAndUpdate(
            { _id: sikariId, status: 'active' },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedSikari) {
            return null;
        }

        const sikariObject = updatedSikari.toObject();
        const response = {
            ...sikariObject,
            addresses: {
                home: sikariObject.homeAddress || '',
                work: sikariObject.workAddress || ''
            }
        };

        return response;
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