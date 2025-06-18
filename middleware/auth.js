const jwt = require('jsonwebtoken');
const CompanyUser = require('../models/CompanyUser');
const SecurityUser = require('../models/SecurityUser');
const Manager = require('../models/Manager');
const { JWT_SECRET } = require('../config/config');

const auth = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'No token, authorization denied'
          }
        });
      }

      // Extract token
      const token = authHeader.replace('Bearer ', '').trim();
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'No token, authorization denied'
          }
        });
      }

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token'
          }
        });
      }

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
      req.user = {
        id: user._id,
        role: decoded.role,
        companyId: decoded.companyId || user._id
      };
      req.token = token;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Server error in authentication'
        }
      });
    }
  };
};

module.exports = { auth }; 