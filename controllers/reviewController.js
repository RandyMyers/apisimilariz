const Review = require('../models/Review');
const Site = require('../models/Site');
const { asyncHandler } = require('../middleware/errorHandler');
const { findSiteBySlugOrDomain } = require('../utils/siteSlug');

async function recalcSiteStats(websiteId, domain) {
  const d = domain.toLowerCase().trim();
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
  return { userScore: avg, reviewCount: count };
}

exports.listByDomain = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const websiteId = req.websiteId;

  const site = await findSiteBySlugOrDomain(websiteId, req.params.domain);
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const domain = site.domain;

  const [reviews, total] = await Promise.all([
    Review.find({ website: websiteId, domain }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments({ website: websiteId, domain }),
  ]);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: { page, limit, total },
  });
});

exports.create = asyncHandler(async (req, res) => {
  const websiteId = req.websiteId;
  const site = await findSiteBySlugOrDomain(websiteId, req.params.domain);
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const domain = site.domain;

  const authorName = req.body.authorName?.trim() || (req.user ? req.user.name : 'Anonymous');
  const review = await Review.create({
    website: websiteId,
    domain,
    user: req.user ? req.user._id : null,
    authorName,
    rating: req.body.rating,
    text: (req.body.text || '').trim(),
  });

  await recalcSiteStats(websiteId, domain);

  res.status(201).json({ success: true, data: review });
});
