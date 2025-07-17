const passwordValidator = require('password-validator');

const schema = new passwordValidator();

// Password requirements
schema
  .is().min(8)                                    // Minimum length 8
  .is().max(100)                                  // Maximum length 100
  .has().uppercase()                              // Must have uppercase letters
  .has().lowercase()                              // Must have lowercase letters
  .has().digits(1)                                // Must have at least 1 digit
  .has().symbols(1)                               // Must have at least 1 symbol
  .has().not().spaces();                          // Should not have spaces

const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_REQUIRED',
        message: 'Password is required'
      }
    });
  }

  const validationResult = schema.validate(password, { list: true });
  
  if (validationResult.length > 0) {
    const errors = validationResult.map(error => {
      switch (error) {
        case 'min': return 'Password must be at least 8 characters long';
        case 'max': return 'Password must not exceed 100 characters';
        case 'uppercase': return 'Password must contain at least one uppercase letter';
        case 'lowercase': return 'Password must contain at least one lowercase letter';
        case 'digits': return 'Password must contain at least one number';
        case 'symbols': return 'Password must contain at least one special character';
        case 'spaces': return 'Password must not contain spaces';
        default: return 'Invalid password format';
      }
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_VALIDATION_FAILED',
        message: 'Password validation failed',
        details: errors
      }
    });
  }

  next();
};

module.exports = validatePassword; 