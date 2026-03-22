const mongoose = require('mongoose');
const Site = require('../models/Site');
const Website = require('../models/Website');
const { asyncHandler } = require('../middleware/errorHandler');
const { domainToSlug, uniqueSlugForWebsite } = require('../utils/siteSlug');

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
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const skip = (page - 1) * limit;
  const category = req.query.category ? String(req.query.category).trim() : '';
  const q = req.query.q ? String(req.query.q).trim() : '';
  const trending = req.query.trending ? String(req.query.trending).trim() : '';
  const sortKey = (req.query.sort || 'updated').toString().toLowerCase();

  const filter = {};
  if (websiteId) filter.website = websiteId;
  if (category) filter.category = category;
  if (trending && ['Top choice', 'Rising', 'Stable'].includes(trending)) {
    filter.trending = trending;
  }
  if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { domain: new RegExp(q, 'i') },
      { slug: new RegExp(q, 'i') },
      { category: new RegExp(q, 'i') },
    ];
  }

  let sort = { updatedAt: -1 };
  if (sortKey === 'score') sort = { userScore: -1, similarityScore: -1, domain: 1 };
  if (sortKey === 'domain') sort = { domain: 1 };
  if (sortKey === 'title') sort = { title: 1 };

  const [sites, total] = await Promise.all([
    Site.find(filter).populate('website', 'name slug').sort(sort).skip(skip).limit(limit).lean(),
    Site.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: sites,
    pagination: { page, limit, total },
  });
});

/** GET /api/admin/sites/:id/curated-similar */
exports.getCuratedSimilar = asyncHandler(async (req, res) => {
  const main = await Site.findById(req.params.id).populate('website', 'name slug').lean();
  if (!main) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const raw = main.curatedSimilar || [];
  const sorted = [...raw].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const ids = sorted.map((x) => x.site).filter(Boolean);
  if (ids.length === 0) {
    return res.status(200).json({ success: true, data: { mainSite: main, items: [] } });
  }
  const wid = main.website && main.website._id ? main.website._id : main.website;
  const docs = await Site.find({ _id: { $in: ids }, website: wid }).lean();
  const byId = new Map(docs.map((s) => [String(s._id), s]));
  const items = sorted
    .map((row) => {
      const doc = byId.get(String(row.site));
      if (!doc) return null;
      return { sortOrder: row.sortOrder || 0, site: doc };
    })
    .filter(Boolean);
  res.status(200).json({ success: true, data: { mainSite: main, items } });
});

/** PUT /api/admin/sites/:id/curated-similar — body: { items: [{ site: ObjectId, sortOrder }] } */
exports.putCuratedSimilar = asyncHandler(async (req, res) => {
  const main = await Site.findById(req.params.id);
  if (!main) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const normalized = [];
  const seen = new Set();
  for (let i = 0; i < items.length; i += 1) {
    const row = items[i] || {};
    const sid = row.site || row.siteId;
    if (!sid || !mongoose.Types.ObjectId.isValid(sid)) continue;
    const idStr = String(new mongoose.Types.ObjectId(sid));
    if (seen.has(idStr)) continue;
    if (idStr === String(main._id)) continue;
    seen.add(idStr);
    const child = await Site.findOne({ _id: sid, website: main.website }).select('_id').lean();
    if (!child) continue;
    normalized.push({
      site: child._id,
      sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : i,
    });
  }
  main.curatedSimilar = normalized;
  main.updatedAt = new Date();
  await main.save();
  const updated = await Site.findById(main._id).populate('website', 'name slug').lean();
  res.status(200).json({ success: true, data: updated });
});

exports.getById = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id).lean();
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  res.status(200).json({ success: true, data: site });
});

exports.create = asyncHandler(async (req, res) => {
  const websiteId = req.body.website;
  if (!websiteId) {
    return res.status(400).json({ success: false, message: 'website (id) is required' });
  }
  const website = await Website.findById(websiteId);
  if (!website) {
    return res.status(400).json({ success: false, message: 'Website not found' });
  }
  const domain = (req.body.domain || '').trim().toLowerCase();
  let slug = (req.body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = domainToSlug(domain);
  slug = await uniqueSlugForWebsite(websiteId, slug);
  const site = await Site.create({
    ...req.body,
    website: websiteId,
    domain,
    slug,
  });
  res.status(201).json({ success: true, data: site });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Site.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  const update = { ...req.body, updatedAt: new Date() };
  if (req.body.domain !== undefined) update.domain = String(req.body.domain).trim().toLowerCase();
  if (req.body.slug !== undefined) {
    let slug = String(req.body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = domainToSlug(update.domain || existing.domain);
    update.slug = await uniqueSlugForWebsite(existing.website, slug, existing._id);
  } else if (req.body.domain !== undefined && req.body.slug === undefined) {
    const d = update.domain;
    const base = domainToSlug(d);
    if (existing.domain !== d) {
      update.slug = await uniqueSlugForWebsite(existing.website, base, existing._id);
    }
  }
  const site = await Site.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
  if (!site) return res.status(404).json({ success: false, message: 'Site not found' });
  res.status(200).json({ success: true, data: site });
});

exports.delete = asyncHandler(async (req, res) => {
  const site = await Site.findByIdAndDelete(req.params.id);
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  res.status(200).json({ success: true, message: 'Site deleted' });
});
