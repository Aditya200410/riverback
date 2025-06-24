/**
 * Generates a full URL for an uploaded file
 * @param {Object} req - Express request object
 * @param {string} filePath - Relative file path
 * @returns {string|null} Full URL or null if no file path provided
 */
const generateFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // Get the protocol (http/https)
  const protocol = process.env.NODE_ENV === 'production' 
    ? 'https'
    : req.protocol;

  // Get the host
  const host = process.env.PRODUCTION_HOST || req.get('host');

  // Combine to form the base URL
  const baseUrl = `${protocol}://${host}`;

  // Return the full URL
  return `${baseUrl}/${filePath}`;
};

module.exports = { generateFileUrl }; 