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

exports.validateCreateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('text')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review text cannot exceed 2000 characters'),
  body('authorName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author name cannot exceed 100 characters'),
  asyncHandler((req, res, next) => runValidation(req, res, next)),
];
