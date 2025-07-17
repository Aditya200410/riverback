// In-memory temporary storage
const tempStorage = new Map();

// Store temporary data with expiration (default 10 minutes)
const storeTempData = (key, data, expirationMinutes = 10) => {
  const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
  tempStorage.set(key, {
    data,
    expiresAt: expirationTime
  });
};

// Get temporary data if not expired
const getTempData = (key) => {
  const item = tempStorage.get(key);
  if (!item) {
    return null;
  }
  
  if (Date.now() > item.expiresAt) {
    tempStorage.delete(key);
    return null;
  }
  
  return item.data;
};

// Remove temporary data
const removeTempData = (key) => {
  tempStorage.delete(key);
};

// Clean up expired data (can be called periodically)
const cleanupExpiredData = () => {
  const now = Date.now();
  for (const [key, item] of tempStorage.entries()) {
    if (now > item.expiresAt) {
      tempStorage.delete(key);
    }
  }
};

module.exports = {
  storeTempData,
  getTempData,
  removeTempData,
  cleanupExpiredData
}; 