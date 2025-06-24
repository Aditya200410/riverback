const Collection = require('../models/Collection');

// Add a new collection
exports.addCollection = async (req, res) => {
  try {
    const { sikahriId, sikahriName, phoneNumber, fishes, totalRupees, netRupees } = req.body;
    if (!sikahriId || !sikahriName || !phoneNumber || !Array.isArray(fishes) || fishes.length === 0 || totalRupees == null || netRupees == null) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    // Validate all fish entries
    for (const fish of fishes) {
      if (!fish.fishName || fish.fishRate == null || fish.fishWeight == null || fish.pricePerKg == null) {
        return res.status(400).json({ success: false, message: 'Each fish must have fishName, fishRate, fishWeight, and pricePerKg' });
      }
    }
    const collection = new Collection({ sikahriId, sikahriName, phoneNumber, fishes, totalRupees, netRupees });
    await collection.save();

    const collectionObj = collection.toObject();
    res.status(201).json({ 
      success: true, 
      data: {
        ...collectionObj,
        fishes: collectionObj.fishes.map(fish => ({
          fishName: fish.fishName,
          fishRate: fish.fishRate,
          fishWeight: fish.fishWeight,
          pricePerKg: fish.pricePerKg
        })),
        date: collectionObj.createdAt,
        createdAt: collectionObj.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      data: collections.map(collection => {
        const collectionObj = collection.toObject();
        return {
          ...collectionObj,
          fishes: collectionObj.fishes.map(fish => ({
            fishName: fish.fishName,
            fishRate: fish.fishRate,
            fishWeight: fish.fishWeight,
            pricePerKg: fish.pricePerKg
          })),
          date: collectionObj.createdAt,
          createdAt: collectionObj.createdAt
        };
      })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 