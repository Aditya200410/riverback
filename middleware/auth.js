const jwt = require('jsonwebtoken');
const CompanyUser = require('../models/CompanyUser');
const SecurityUser = require('../models/SecurityUser');
const Manager = require('../models/Manager');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'No token provided'
          }
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Find user based on role
      let user = null;
      if (roles.includes('company')) {
        user = await CompanyUser.findById(decoded.id).select('-password');
      }
      if (roles.includes('security')) {
        user = await SecurityUser.findById(decoded.id).select('-password');
      }
      if (roles.includes('manager')) {
        user = await Manager.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Add user to request
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }
  };
};

module.exports = auth; 