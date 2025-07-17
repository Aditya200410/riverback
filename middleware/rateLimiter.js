const rateLimit = require('express-rate-limit');

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: process.env.LOGIN_RATE_LIMIT_WINDOW || 3600000, // 1 hour
    max: process.env.LOGIN_RATE_LIMIT_MAX || 5, // 5 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please try again later.'
        }
    }
});

module.exports = {
    loginLimiter
}; 