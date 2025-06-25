/**
 * Generates a full URL for an uploaded file
 * @param {Object} req - Express request object
 * @param {string} filePath - Relative file path
 * @returns {string|null} Full URL or null if no file path provided
 */
const generateFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // Always use production URL in production
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://riverfish.deltospark.com'
    : req.protocol + '://' + req.get('host');

  return `${baseUrl}/${filePath}`;
};

module.exports = { generateFileUrl }; 