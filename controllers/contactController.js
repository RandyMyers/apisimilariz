const ContactMessage = require('../models/ContactMessage');
const { asyncHandler } = require('../middleware/errorHandler');

exports.create = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  await ContactMessage.create({
    website: req.websiteId,
    name: (name || '').trim(),
    email: (email || '').trim().toLowerCase(),
    subject: (subject || '').trim(),
    message: (message || '').trim(),
    type: 'contact',
  });
  res.status(201).json({
    success: true,
    message: 'Message sent. We will get back to you soon.',
  });
});
