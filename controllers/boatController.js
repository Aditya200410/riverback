const Boat = require('../models/Boat');

// Get all boats for a company
const getAllBoats = async (companyId) => {
    try {
        const query = companyId ? { companyId, status: 'active' } : { status: 'active' };
        return await Boat.find(query)
            .sort({ createdAt: -1 });
    } catch (error) {
        console.error('Error in getAllBoats:', error);
        throw error;
    }
};

// Get boat by ID
const getBoatById = async (boatId, companyId) => {
    try {
        const query = companyId ? { _id: boatId, companyId, status: 'active' } : { _id: boatId, status: 'active' };
        return await Boat.findOne(query);
    } catch (error) {
        console.error('Error in getBoatById:', error);
        throw error;
    }
};

// Create new boat
const createBoat = async (boatData) => {
    try {
        const boat = new Boat({
            ...boatData,
            status: 'active'
        });
        return await boat.save();
    } catch (error) {
        console.error('Error in createBoat:', error);
        throw error;
    }
};

// Update boat
const updateBoat = async (boatId, updateData, companyId) => {
    try {
        const query = companyId ? { _id: boatId, companyId, status: 'active' } : { _id: boatId, status: 'active' };
        return await Boat.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true, runValidators: true }
        );
    } catch (error) {
        console.error('Error in updateBoat:', error);
        throw error;
    }
};

// Delete boat (soft delete)
const deleteBoat = async (boatId, companyId) => {
    try {
        const query = companyId ? { _id: boatId, companyId, status: 'active' } : { _id: boatId, status: 'active' };
        return await Boat.findOneAndUpdate(
            query,
            { $set: { status: 'inactive' } },
            { new: true }
        );
    } catch (error) {
        console.error('Error in deleteBoat:', error);
        throw error;
    }
};

module.exports = {
    getAllBoats,
    getBoatById,
    createBoat,
    updateBoat,
    deleteBoat
}; 