const mongoose = require('mongoose');
const SimilarityVote = require('../models/SimilarityVote');
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

/** GET /api/admin/similarity-votes — website optional; mainDomain optional */
exports.list = asyncHandler(async (req, res) => {
  const websiteParam = req.query.website;
  const websiteId = websiteParam ? await resolveWebsiteId(websiteParam) : null;
  if (websiteParam && !websiteId) {
    return res.status(400).json({ success: false, message: 'Invalid website (id or slug)' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const mainDomain = req.query.mainDomain ? String(req.query.mainDomain).trim().toLowerCase() : '';

  const filter = { ...(websiteId ? { website: websiteId } : {}) };
  if (mainDomain) filter.mainDomain = new RegExp(mainDomain, 'i');

  const [items, total] = await Promise.all([
    SimilarityVote.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('website', 'name slug')
      .lean(),
    SimilarityVote.countDocuments(filter),
  ]);

  const data = items.map((v) => ({
    id: v._id,
    mainDomain: v.mainDomain,
    alternativeDomain: v.alternativeDomain,
    rating: v.rating,
    reason: v.reason || null,
    createdAt: v.createdAt,
    website:
      v.website && typeof v.website === 'object' && (v.website.name || v.website.slug)
        ? { name: v.website.name, slug: v.website.slug }
        : null,
    voter: v.user ? { name: v.user.name, email: v.user.email } : null,
    anonymousInfo: !v.user && v.ip ? { ip: v.ip, hasUserAgent: !!v.userAgent } : null,
  }));

  res.status(200).json({
    success: true,
    data,
    pagination: { page, limit, total },
  });
});
