const SiteSubmission = require('../models/SiteSubmission');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const { domain, description, category, email, alternativeTo } = req.body;
  const cat = await Category.findOne({
    _id: category,
    website: req.websiteId,
    active: true,
  })
    .select('_id')
    .lean();
  if (!cat) {
    return res.status(400).json({ success: false, message: 'Invalid or inactive category for this site.' });
  }
  const submission = await SiteSubmission.create({
    website: req.websiteId,
    domain: (domain || '').trim().toLowerCase(),
    description: (description || '').trim(),
    category: cat._id,
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
