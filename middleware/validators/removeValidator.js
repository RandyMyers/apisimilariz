const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../errorHandler');

function extractDomainFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '').split('/')[0];
  return withoutProtocol.replace(/^www\./, '') || null;
}

function emailDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const part = email.split('@')[1];
  return part ? part.toLowerCase().trim() : null;
}

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

exports.validateRemoveRequest = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('domainUrl')
    .trim()
    .notEmpty()
    .withMessage('Domain URL is required'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 1000 })
    .withMessage('Reason cannot exceed 1000 characters'),
  body('removeOption').trim().notEmpty().withMessage('Remove option is required'),
  body('nospam').optional().trim(),
  asyncHandler((req, res, next) => runValidation(req, res, next)),
  (req, res, next) => {
    const domainFromUrl = extractDomainFromUrl(req.body.domainUrl);
    const domainFromEmail = emailDomain(req.body.email);
    if (domainFromUrl && domainFromEmail && domainFromEmail !== domainFromUrl) {
      return res.status(400).json({
        success: false,
        message: 'Email domain must match the domain you are requesting to remove',
      });
    }
    next();
  },
];
