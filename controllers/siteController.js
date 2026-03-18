const Site = require('../models/Site');
const SponsoredItem = require('../models/SponsoredItem');
const SimilarityVote = require('../models/SimilarityVote');
const { asyncHandler } = require('../middleware/errorHandler');
const { applyI18n } = require('../utils/i18nMerge');

const SITE_I18N_FIELDS = ['title', 'description', 'longDescription', 'features'];
const SITE_I18N_NESTED = ['seo', 'similarPageSeo'];
const SPONSORED_I18N_FIELDS = ['title', 'description', 'code'];
const SPONSORED_I18N_NESTED = ['seo'];

exports.list = asyncHandler(async (req, res) => {
  const { q, category, sort = 'userScore', page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const filter = { website: req.websiteId };
  if (category && category.trim()) filter.category = category.trim();
  if (q && q.trim()) {
    filter.$or = [
      { title: new RegExp(q.trim(), 'i') },
      { description: new RegExp(q.trim(), 'i') },
      { domain: new RegExp(q.trim(), 'i') },
      { tags: new RegExp(q.trim(), 'i') },
      { category: new RegExp(q.trim(), 'i') },
    ];
  }

  let query = Site.find(filter).lean();
  if (sort === 'alternativeRank') query = query.sort({ alternativeRank: 1, userScore: -1, similarityScore: -1 });
  else if (sort === 'relevance' && q && q.trim()) query = query.sort({ similarityScore: -1, userScore: -1 });
  else query = query.sort({ userScore: -1, similarityScore: -1, reviewCount: -1 });

  const [sites, total] = await Promise.all([
    query.skip(skip).limit(limitNum),
    Site.countDocuments(filter),
  ]);

  const locale = req.locale || null;
  const data = locale ? sites.map((s) => applyI18n(s, locale, SITE_I18N_FIELDS, SITE_I18N_NESTED)) : sites.map((s) => ({ ...s, i18n: undefined }));

  res.status(200).json({
    success: true,
    data,
    pagination: { page: Math.floor(skip / limitNum) + 1, limit: limitNum, total },
  });
});

exports.getByDomain = asyncHandler(async (req, res) => {
  const domain = (req.params.domain || '').toLowerCase().trim();
  const site = await Site.findOne({ website: req.websiteId, domain }).lean();
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const locale = req.locale || null;
  const data = locale ? applyI18n(site, locale, SITE_I18N_FIELDS, SITE_I18N_NESTED) : { ...site, i18n: undefined };
  res.status(200).json({ success: true, data });
});

exports.getTop = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const sites = await Site.find({ website: req.websiteId })
    .sort({ userScore: -1, similarityScore: -1, reviewCount: -1, trending: 1 })
    .limit(limit)
    .lean();
  const locale = req.locale || null;
  const data = locale ? sites.map((s) => applyI18n(s, locale, SITE_I18N_FIELDS, SITE_I18N_NESTED)) : sites.map((s) => ({ ...s, i18n: undefined }));
  res.status(200).json({ success: true, data });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Site.distinct('category', { website: req.websiteId }).then((arr) => arr.filter(Boolean).sort());
  res.status(200).json({ success: true, data: categories });
});

exports.getSponsoredByDomain = asyncHandler(async (req, res) => {
  const domain = (req.params.domain || '').toLowerCase().trim();
  const site = await Site.findOne({ website: req.websiteId, domain }).lean();
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const items = await SponsoredItem.find({ website: req.websiteId, domain }).lean();
  const locale = req.locale || null;
  const data = locale
    ? items.map((x) => applyI18n(x, locale, SPONSORED_I18N_FIELDS, SPONSORED_I18N_NESTED))
    : items.map((x) => ({ ...x, i18n: undefined }));
  res.status(200).json({ success: true, data });
});

/** GET /api/sites/:domain/similar - sites in same category with similarity vote stats, sorted by vote average (alternative rank) */
exports.getSimilarWithVotes = asyncHandler(async (req, res) => {
  const mainDomain = (req.params.domain || '').toLowerCase().trim();
  const mainSite = await Site.findOne({ website: req.websiteId, domain: mainDomain }).lean();
  if (!mainSite) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const sites = await Site.find({
    website: req.websiteId,
    category: mainSite.category,
    domain: { $ne: mainDomain },
  })
    .sort({ userScore: -1, similarityScore: -1 })
    .limit(limit * 2)
    .lean();

  const votes = await SimilarityVote.aggregate([
    { $match: { website: req.websiteId, mainDomain } },
    { $group: { _id: '$alternativeDomain', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const voteMap = {};
  votes.forEach((v) => {
    voteMap[v._id] = { averageRating: Math.round(v.avg * 10) / 10, voteCount: v.count };
  });

  const withStats = sites.map((s) => ({
    ...s,
    similarityVoteStats: voteMap[s.domain] || null,
  }));
  withStats.sort((a, b) => {
    const aAvg = (a.similarityVoteStats && a.similarityVoteStats.averageRating) || 0;
    const bAvg = (b.similarityVoteStats && b.similarityVoteStats.averageRating) || 0;
    if (bAvg !== aAvg) return bAvg - aAvg;
    return (b.similarityScore || 0) - (a.similarityScore || 0);
  });
  const data = withStats.slice(0, limit);
  res.status(200).json({ success: true, data });
});

/** POST /api/sites/:domain/similarity-vote - rate how similar alternativeDomain is to main domain. Auth optional (we store user if logged in). */
exports.submitSimilarityVote = asyncHandler(async (req, res) => {
  const mainDomain = (req.params.domain || '').toLowerCase().trim();
  const { alternativeDomain: rawAlt, rating, reason: rawReason } = req.body;
  const alternativeDomain = (rawAlt || '').toLowerCase().trim();
  const reason = typeof rawReason === 'string' ? rawReason.trim().slice(0, 500) : '';
  if (!alternativeDomain) {
    return res.status(400).json({ success: false, message: 'alternativeDomain is required' });
  }
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
  }
  const [mainSite, altSite] = await Promise.all([
    Site.findOne({ website: req.websiteId, domain: mainDomain }),
    Site.findOne({ website: req.websiteId, domain: alternativeDomain }),
  ]);
  if (!mainSite) {
    return res.status(404).json({ success: false, message: 'Main site not found' });
  }
  if (!altSite) {
    return res.status(404).json({ success: false, message: 'Alternative site not found' });
  }
  const ip = (req.ip || req.connection?.remoteAddress || '').toString().trim().slice(0, 45);
  const userAgent = (req.get && req.get('User-Agent') || '').toString().trim().slice(0, 512);

  await SimilarityVote.create({
    website: req.websiteId,
    mainDomain,
    alternativeDomain,
    rating: Math.round(r * 10) / 10,
    reason: reason || undefined,
    user: req.user ? req.user._id : null,
    ip: ip || undefined,
    userAgent: userAgent || undefined,
  });
  res.status(201).json({ success: true, message: 'Vote recorded' });
});
