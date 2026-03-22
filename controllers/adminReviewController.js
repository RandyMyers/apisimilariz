const mongoose = require('mongoose');
const Review = require('../models/Review');
const Website = require('../models/Website');
const Site = require('../models/Site');
const { asyncHandler } = require('../middleware/errorHandler');

const resolveWebsiteId = async (websiteParam) => {
  if (!websiteParam) return null;
  if (mongoose.Types.ObjectId.isValid(websiteParam) && String(new mongoose.Types.ObjectId(websiteParam)) === websiteParam) {
    return websiteParam;
  }
  const w = await Website.findOne({ slug: String(websiteParam).trim().toLowerCase() }).select('_id').lean();
  return w ? w._id : null;
};

async function recalcSiteStats(websiteId, domain) {
  const d = String(domain || '').toLowerCase().trim();
  if (!d) return;
  const stats = await Review.aggregate([
    { $match: { website: websiteId, domain: d } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = stats[0] ? Math.round(stats[0].avg * 10) / 10 : 0;
  const count = stats[0] ? stats[0].count : 0;
  await Site.updateOne(
    { website: websiteId, domain: d },
    { $set: { userScore: avg, reviewCount: count, updatedAt: new Date() } }
  );
}

exports.list = asyncHandler(async (req, res) => {
  const websiteParam = req.query.website;
  const websiteId = websiteParam ? await resolveWebsiteId(websiteParam) : null;
  if (websiteParam && !websiteId) {
    return res.status(400).json({ success: false, message: 'Invalid website (id or slug)' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const domain = req.query.domain ? String(req.query.domain).trim().toLowerCase() : '';

  const filter = { ...(websiteId ? { website: websiteId } : {}) };
  if (domain) filter.domain = new RegExp(domain, 'i');

  const [items, total] = await Promise.all([
    Review.find(filter).populate('website', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total },
  });
});

exports.delete = asyncHandler(async (req, res) => {
  const item = await Review.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }
  await recalcSiteStats(item.website, item.domain);
  res.status(200).json({ success: true, message: 'Review deleted' });
});

