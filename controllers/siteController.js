const Site = require('../models/Site');
const Category = require('../models/Category');
const SponsoredItem = require('../models/SponsoredItem');
const SimilarityVote = require('../models/SimilarityVote');
const { asyncHandler } = require('../middleware/errorHandler');
const { applyI18n } = require('../utils/i18nMerge');
const { findSiteBySlugOrDomain } = require('../utils/siteSlug');
const { resolveCategoryIdForWebsite, escapeRegex } = require('../utils/resolveCategoryFilter');

const SITE_I18N_FIELDS = ['title', 'description', 'longDescription', 'features'];
const SITE_I18N_NESTED = ['seo', 'similarPageSeo'];
const SPONSORED_I18N_FIELDS = ['title', 'description', 'code'];
const SPONSORED_I18N_NESTED = ['seo'];

function clampInt(val, min, max, fallback) {
  const n = parseInt(val, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

exports.list = asyncHandler(async (req, res) => {
  const { q, category, sort = 'userScore', page = 1, limit = 20 } = req.query;
  const pageNum = clampInt(page, 1, 1000000, 1);
  const limitNum = clampInt(limit, 1, 50, 20);
  const skip = (pageNum - 1) * limitNum;

  const filter = { website: req.websiteId };
  if (category && category.trim()) {
    const cid = await resolveCategoryIdForWebsite(req.websiteId, category);
    if (cid) filter.category = cid;
    else filter._id = null;
  }
  if (q && q.trim()) {
    const qt = q.trim();
    const catDocs = await Category.find({
      website: req.websiteId,
      name: new RegExp(escapeRegex(qt), 'i'),
    })
      .select('_id')
      .lean();
    const catIds = catDocs.map((c) => c._id);
    filter.$or = [
      { title: new RegExp(qt, 'i') },
      { description: new RegExp(qt, 'i') },
      { domain: new RegExp(qt, 'i') },
      { slug: new RegExp(qt, 'i') },
      { tags: new RegExp(qt, 'i') },
      ...(catIds.length ? [{ category: { $in: catIds } }] : []),
    ];
  }

  let query = Site.find(filter).populate('category', 'name slug').lean();
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
    pagination: { page: pageNum, limit: limitNum, total },
  });
});

exports.getByDomain = asyncHandler(async (req, res) => {
  const site = await findSiteBySlugOrDomain(req.websiteId, req.params.domain);
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const locale = req.locale || null;
  const data = locale ? applyI18n(site, locale, SITE_I18N_FIELDS, SITE_I18N_NESTED) : { ...site, i18n: undefined };
  res.status(200).json({ success: true, data });
});

exports.getTop = asyncHandler(async (req, res) => {
  const limit = clampInt(req.query.limit, 1, 50, 20);
  const sites = await Site.find({ website: req.websiteId })
    .populate('category', 'name slug')
    .sort({ userScore: -1, similarityScore: -1, reviewCount: -1, trending: 1 })
    .limit(limit)
    .lean();
  const locale = req.locale || null;
  const data = locale ? sites.map((s) => applyI18n(s, locale, SITE_I18N_FIELDS, SITE_I18N_NESTED)) : sites.map((s) => ({ ...s, i18n: undefined }));
  res.status(200).json({ success: true, data });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const rows = await Category.find({ website: req.websiteId, active: true })
    .select('name slug sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const data = rows.map((c) => ({
    _id: c._id,
    id: c._id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
  }));
  res.status(200).json({ success: true, data });
});

exports.getSponsoredByDomain = asyncHandler(async (req, res) => {
  const site = await findSiteBySlugOrDomain(req.websiteId, req.params.domain);
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const domain = site.domain;
  const items = await SponsoredItem.find({ website: req.websiteId, domain }).lean();
  const locale = req.locale || null;
  const data = locale
    ? items.map((x) => applyI18n(x, locale, SPONSORED_I18N_FIELDS, SPONSORED_I18N_NESTED))
    : items.map((x) => ({ ...x, i18n: undefined }));
  res.status(200).json({ success: true, data });
});

/** GET /api/sites/:domain/similar — only admin-curated list (curatedSimilar); empty if none set */
exports.getSimilarWithVotes = asyncHandler(async (req, res) => {
  const mainSite = await findSiteBySlugOrDomain(req.websiteId, req.params.domain);
  if (!mainSite) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const mainDomain = mainSite.domain;
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const raw = mainSite.curatedSimilar || [];
  const curatedSorted = [...raw].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const curatedIds = curatedSorted.map((x) => x.site).filter(Boolean);

  let sites = [];
  if (curatedIds.length > 0) {
    const docs = await Site.find({
      _id: { $in: curatedIds },
      website: req.websiteId,
      domain: { $ne: mainDomain },
    })
      .populate('category', 'name slug')
      .lean();
    const byId = new Map(docs.map((s) => [String(s._id), s]));
    sites = curatedIds.map((id) => byId.get(String(id))).filter(Boolean);
  }

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
  const sliced = withStats.slice(0, limit);
  const locale = req.locale || null;
  const data = locale
    ? sliced.map((s) => applyI18n(s, locale, SITE_I18N_FIELDS, SITE_I18N_NESTED))
    : sliced.map((s) => ({ ...s, i18n: undefined }));
  res.status(200).json({ success: true, data });
});

/** POST /api/sites/:domain/similarity-vote - rate how similar alternativeDomain is to main domain. Auth optional (we store user if logged in). */
exports.submitSimilarityVote = asyncHandler(async (req, res) => {
  const mainSiteDoc = await findSiteBySlugOrDomain(req.websiteId, req.params.domain);
  if (!mainSiteDoc) {
    return res.status(404).json({ success: false, message: 'Main site not found' });
  }
  const mainDomain = mainSiteDoc.domain;
  const { alternativeDomain: rawAlt, rating, reason: rawReason } = req.body;
  let alternativeDomain = (rawAlt || '').toLowerCase().trim();
  const reason = typeof rawReason === 'string' ? rawReason.trim().slice(0, 500) : '';
  const r = Number(rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
  }
  const altBySlug = await findSiteBySlugOrDomain(req.websiteId, alternativeDomain);
  if (altBySlug) alternativeDomain = altBySlug.domain;
  if (!alternativeDomain) {
    return res.status(400).json({ success: false, message: 'alternativeDomain is required' });
  }
  const [mainSite, altSite] = await Promise.all([
    Site.findOne({ website: req.websiteId, domain: mainDomain }),
    Site.findOne({ website: req.websiteId, domain: alternativeDomain }),
  ]);
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
