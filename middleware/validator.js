const { body, validationResult } = require('express-validator');

// Common validation rules
const commonRules = {
  mobile: body('mobile')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile number must be 10 digits')
    .isNumeric()
    .withMessage('Mobile number must contain only digits'),
  
  password: body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  aadhar: body('aadhar')
    .trim()
    .isLength({ min: 12, max: 12 })
    .withMessage('Aadhar number must be 12 digits')
    .isNumeric()
    .withMessage('Aadhar number must contain only digits'),
  
  name: body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
};

// Company user specific rules
const companyUserRules = {
  companyName: body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  
  companyAddress: body('companyAddress')
    .trim()
    .notEmpty()
    .withMessage('Company address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Company address must be between 5 and 200 characters'),
};

// Security user specific rules
const securityUserRules = {
  securityCompany: body('securityCompany')
    .trim()
    .notEmpty()
    .withMessage('Security company name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Security company name must be between 2 and 100 characters'),
};

// Manager specific rules
const managerRules = {};

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formattedErrors
      }
    });
  }
  next();
};

// Validation rule sets
const validationRules = {
  // Login validation
  login: [commonRules.mobile, commonRules.password],

  // Company user validation
  companySignup: [
    commonRules.name,
    commonRules.mobile,
    commonRules.password,
    commonRules.email,
    companyUserRules.companyName,
    companyUserRules.companyAddress
  ],

  // Security user validation
  securitySignup: [
    commonRules.name,
    commonRules.mobile,
    commonRules.password,
    commonRules.aadhar,
    securityUserRules.securityCompany
  ],

  // Manager validation
  managerSignup: [
    commonRules.name,
    commonRules.mobile,
    commonRules.password,
    commonRules.aadhar
  ]
};

module.exports = {
  validate,
  validationRules,
  commonRules,
  companyUserRules,
  securityUserRules,
  managerRules
}; 