// Temporary storage for user data during OTP verification
const tempStorage = new Map();

// Store user data with OTP
const storeTempData = (mobile, data) => {
    tempStorage.set(mobile, {
        ...data,
        createdAt: Date.now()
    });
};

// Get user data
const getTempData = (mobile) => {
    return tempStorage.get(mobile);
};

// Remove user data
const removeTempData = (mobile) => {
    tempStorage.delete(mobile);
};

// Cleanup expired data (older than 10 minutes)
const cleanupExpiredData = () => {
    const now = Date.now();
    for (const [mobile, data] of tempStorage.entries()) {
        if (now - data.createdAt > 10 * 60 * 1000) { // 10 minutes
            tempStorage.delete(mobile);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredData, 5 * 60 * 1000);

module.exports = {
    storeTempData,
    getTempData,
    removeTempData
}; 