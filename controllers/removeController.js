const RemoveRequest = require('../models/RemoveRequest');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const { name, email, domainUrl, reason, removeOption, nospam } = req.body;
  await RemoveRequest.create({
    website: req.websiteId,
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    domainUrl: (domainUrl || '').trim(),
    reason: (reason || '').trim(),
    removeOption: (removeOption || '').trim(),
    nospam: nospam != null ? String(nospam).trim() : null,
    status: 'pending',
  });
  res.status(201).json({
    success: true,
    message: 'Request received. We will process it shortly.',
  });
});
