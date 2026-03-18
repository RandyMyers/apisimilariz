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

exports.validateLogin = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  asyncHandler((req, res, next) => runValidation(req, res, next)),
];

exports.validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  asyncHandler((req, res, next) => runValidation(req, res, next)),
];

exports.validateForgotPassword = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  asyncHandler((req, res, next) => runValidation(req, res, next)),
];
