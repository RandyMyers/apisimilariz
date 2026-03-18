const SiteSubmission = require('../models/SiteSubmission');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const { domain, description, category, email, alternativeTo } = req.body;
  const submission = await SiteSubmission.create({
    website: req.websiteId,
    domain: (domain || '').trim().toLowerCase(),
    description: (description || '').trim(),
    category: (category || '').trim(),
    email: (email || '').trim().toLowerCase(),
    alternativeTo: alternativeTo ? String(alternativeTo).trim() : null,
    status: 'pending',
  });
  res.status(201).json({
    success: true,
    message: 'Submission received. We will review it shortly.',
    data: { id: submission._id, status: submission.status },
  });
});
