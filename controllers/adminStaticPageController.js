const mongoose = require('mongoose');
const StaticPage = require('../models/StaticPage');
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
  if (websiteParam && !websiteId) return res.status(400).json({ success: false, message: 'Invalid website (id or slug)' });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = websiteId ? { website: websiteId } : {};

  const [items, total] = await Promise.all([
    StaticPage.find(filter).populate('website', 'name slug').sort({ path: 1, slug: 1 }).skip(skip).limit(limit).lean(),
    StaticPage.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: items, pagination: { page, limit, total } });
});

exports.getById = asyncHandler(async (req, res) => {
  const page = await StaticPage.findById(req.params.id).lean();
  if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
  res.status(200).json({ success: true, data: page });
});

exports.create = asyncHandler(async (req, res) => {
  const websiteId = req.body.website;
  if (!websiteId) return res.status(400).json({ success: false, message: 'website (id) is required' });
  const website = await Website.findById(websiteId);
  if (!website) return res.status(400).json({ success: false, message: 'Website not found' });

  const slug = String(req.body.slug || '').trim().toLowerCase();
  const path = String(req.body.path || '').trim();
  if (!slug) return res.status(400).json({ success: false, message: 'slug is required' });

  const page = await StaticPage.create({
    ...req.body,
    website: websiteId,
    slug,
    path,
  });

  res.status(201).json({ success: true, data: page });
});

exports.update = asyncHandler(async (req, res) => {
  const patch = {
    ...req.body,
  };
  if (req.body.slug !== undefined) patch.slug = String(req.body.slug || '').trim().toLowerCase();
  if (req.body.path !== undefined) patch.path = String(req.body.path || '').trim();
  patch.updatedAt = new Date();

  const page = await StaticPage.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true }).lean();
  if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
  res.status(200).json({ success: true, data: page });
});

exports.delete = asyncHandler(async (req, res) => {
  const page = await StaticPage.findByIdAndDelete(req.params.id);
  if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
  res.status(200).json({ success: true, message: 'Page deleted' });
});

const DEFAULT_PAGES = [
  {
    slug: 'about',
    path: 'about',
    title: 'About',
    body: '<h1>About Similaris</h1><p>Similaris helps you discover similar websites, alternatives, and competitors.</p>',
    seo: { sitemap: { include: true, priority: 0.6, changefreq: 'monthly' } },
  },
  {
    slug: 'privacy',
    path: 'privacy',
    title: 'Privacy Policy',
    body: '<h1>Privacy Policy</h1><p>We respect your privacy. Update this page in Admin to match your legal requirements.</p>',
    seo: { sitemap: { include: true, priority: 0.4, changefreq: 'yearly' } },
  },
  {
    slug: 'terms',
    path: 'terms',
    title: 'Terms of Service',
    body: '<h1>Terms of Service</h1><p>Update this page in Admin to match your terms.</p>',
    seo: { sitemap: { include: true, priority: 0.4, changefreq: 'yearly' } },
  },
];

/**
 * POST /api/admin/pages/seed-defaults?website=<id|slug>
 * Upserts missing default pages for a website. Does NOT overwrite existing pages.
 */
exports.seedDefaults = asyncHandler(async (req, res) => {
  const websiteId = await resolveWebsiteId(req.query.website || req.body.website);
  if (!websiteId) return res.status(400).json({ success: false, message: 'website (id or slug) is required' });

  const existing = await StaticPage.find({ website: websiteId, slug: { $in: DEFAULT_PAGES.map((p) => p.slug) } })
    .select('slug')
    .lean();
  const existingSlugs = new Set(existing.map((x) => x.slug));

  const toCreate = DEFAULT_PAGES.filter((p) => !existingSlugs.has(p.slug)).map((p) => ({ ...p, website: websiteId }));
  const created = toCreate.length ? await StaticPage.insertMany(toCreate) : [];

  res.status(200).json({
    success: true,
    message: created.length ? `Seeded ${created.length} pages.` : 'All default pages already exist.',
    created: created.map((p) => ({ _id: p._id, slug: p.slug, path: p.path, title: p.title })),
  });
});

