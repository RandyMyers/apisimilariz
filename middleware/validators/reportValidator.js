const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../errorHandler');

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

exports.validateReport = [
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  asyncHandler((req, res, next) => runValidation(req, res, next)),
];
