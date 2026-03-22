const mongoose = require('mongoose');
const NewsletterSubscription = require('../models/NewsletterSubscription');
const Website = require('../models/Website');
const { asyncHandler } = require('../middleware/errorHandler');

const resolveWebsiteId = async (websiteParam) => {
  if (!websiteParam) return null;
  if (mongoose.Types.ObjectId.isValid(websiteParam) && String(new mongoose.Types.ObjectId(websiteParam)) === websiteParam) {
    return websiteParam;
  }
  const w = await Website.findOne({ slug: String(websiteParam).trim().toLowerCase() }).select('_id').lean();
  return w ? w._id : null;
};

exports.list = asyncHandler(async (req, res) => {
  const websiteParam = req.query.website;
  const websiteId = websiteParam ? await resolveWebsiteId(websiteParam) : null;
  if (websiteParam && !websiteId) {
    return res.status(400).json({ success: false, message: 'Invalid website (id or slug)' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = websiteId ? { website: websiteId } : {};

  const [items, total] = await Promise.all([
    NewsletterSubscription.find(filter).populate('website', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    NewsletterSubscription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total },
  });
});

exports.delete = asyncHandler(async (req, res) => {
  const item = await NewsletterSubscription.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Subscription not found' });
  }
  res.status(200).json({ success: true, message: 'Subscription deleted' });
});
