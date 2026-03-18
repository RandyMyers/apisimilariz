const ContactMessage = require('../models/ContactMessage');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const { domain, message, email } = req.body;
  await ContactMessage.create({
    website: req.websiteId,
    name: 'Report',
    email: (email || '').trim() || 'noreply@similaris.app',
    subject: `Report wrong info: ${(domain || '').trim()}`,
    message: (message || '').trim() || 'No additional message provided.',
    type: 'report',
    domain: (domain || '').trim() || null,
  });
  res.status(201).json({
    success: true,
    message: 'Report received. We will review it shortly.',
  });
});
