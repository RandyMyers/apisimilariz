const NewsletterSubscription = require('../models/NewsletterSubscription');
const { asyncHandler } = require('../middleware/errorHandler');

exports.subscribe = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const existing = await NewsletterSubscription.findOne({ website: req.websiteId, email });
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'You are already subscribed.',
    });
  }
  await NewsletterSubscription.create({ website: req.websiteId, email });
  res.status(201).json({
    success: true,
    message: 'Successfully subscribed to the newsletter.',
  });
});
