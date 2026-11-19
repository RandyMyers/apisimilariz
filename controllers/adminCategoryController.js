const mongoose = require('mongoose');
const Category = require('../models/Category');
const Site = require('../models/Site');
const Website = require('../models/Website');
const { asyncHandler } = require('../middleware/errorHandler');
const { nameToSlug, uniqueCategorySlug } = require('../utils/categorySlug');

const normalizeFaqs = (faqs) => {
  if (!Array.isArray(faqs)) return [];
  return faqs
    .map((faq) => ({
      question: String(faq?.question || '').trim(),
      answer: String(faq?.answer || '').trim(),
    }))
    .filter((faq) => faq.question && faq.answer)
    .slice(0, 50);
};

const normalizeSecondaryKeywords = (value) => {
  const values = Array.isArray(value)
    ? value
    : String(value || '').split(',').map((item) => item.trim());
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))].slice(0, 10);
};

const normalizeSeo = (seo) => {
  if (!seo || typeof seo !== 'object') return {};
  const out = { ...seo };
  if (out.secondaryKeywords !== undefined) {
    out.secondaryKeywords = normalizeSecondaryKeywords(out.secondaryKeywords);
  }
  if (!out.keywords && out.primaryKeyword) {
    out.keywords = [out.primaryKeyword, ...(out.secondaryKeywords || [])].join(', ');
  }
  if (out.sitemap && typeof out.sitemap === 'object') {
    out.sitemap = {
      include: out.sitemap.include !== false,
      priority: Number.isFinite(Number(out.sitemap.priority)) ? Number(out.sitemap.priority) : 0.5,
      changefreq: out.sitemap.changefreq || 'weekly',
    };
  }
  return out;
};

const normalizeI18n = (i18n) => {
  if (!i18n || typeof i18n !== 'object') return {};
  const cleaned = {};
  Object.entries(i18n).forEach(([locale, value]) => {
    if (!locale || !value || typeof value !== 'object') return;
    const entry = {};
    ['name', 'slug', 'description', 'intro', 'pageContent', 'imageAlt'].forEach((key) => {
      if (value[key] !== undefined && value[key] !== null && String(value[key]).trim() !== '') {
        entry[key] = String(value[key]).trim();
      }
    });
    if (value.faqs !== undefined) entry.faqs = normalizeFaqs(value.faqs);
    if (value.seo !== undefined) entry.seo = normalizeSeo(value.seo);
    if (Object.keys(entry).length) cleaned[locale] = entry;
  });
  return cleaned;
};

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
  if (!websiteParam) {
    return res.status(400).json({ success: false, message: 'website query (id or slug) is required' });
  }
  const websiteId = await resolveWebsiteId(websiteParam);
  if (!websiteId) {
    return res.status(400).json({ success: false, message: 'Invalid website' });
  }
  const rows = await Category.find({ website: websiteId }).sort({ sortOrder: 1, name: 1 }).lean();
  const withCounts = await Promise.all(
    rows.map(async (c) => {
      const siteCount = await Site.countDocuments({ website: websiteId, category: c._id });
      return { ...c, siteCount };
    })
  );
  res.status(200).json({ success: true, data: withCounts });
});

exports.getById = asyncHandler(async (req, res) => {
  const row = await Category.findById(req.params.id).lean();
  if (!row) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  const siteCount = await Site.countDocuments({ category: row._id });
  res.status(200).json({ success: true, data: { ...row, siteCount } });
});

exports.create = asyncHandler(async (req, res) => {
  const websiteId = req.body.website ? await resolveWebsiteId(req.body.website) : null;
  if (!websiteId) {
    return res.status(400).json({ success: false, message: 'Valid website (id or slug) is required' });
  }
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }
  let slug = String(req.body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = nameToSlug(name);
  slug = await uniqueCategorySlug(websiteId, slug);

  const row = await Category.create({
    website: websiteId,
    name,
    slug,
    description: String(req.body.description || '').trim(),
    image: String(req.body.image || '').trim(),
    imageAlt: String(req.body.imageAlt || '').trim(),
    intro: String(req.body.intro || '').trim(),
    pageContent: String(req.body.pageContent || ''),
    faqs: normalizeFaqs(req.body.faqs),
    seo: normalizeSeo(req.body.seo),
    i18n: normalizeI18n(req.body.i18n),
    sortOrder: Number.isFinite(Number(req.body.sortOrder)) ? Number(req.body.sortOrder) : 0,
    active: req.body.active !== false,
  });
  res.status(201).json({ success: true, data: row });
});

exports.update = asyncHandler(async (req, res) => {
  const existing = await Category.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  const update = { updatedAt: new Date() };
  if (req.body.name !== undefined) update.name = String(req.body.name).trim();
  if (req.body.description !== undefined) update.description = String(req.body.description).trim();
  if (req.body.image !== undefined) update.image = String(req.body.image).trim();
  if (req.body.imageAlt !== undefined) update.imageAlt = String(req.body.imageAlt).trim();
  if (req.body.intro !== undefined) update.intro = String(req.body.intro).trim();
  if (req.body.pageContent !== undefined) update.pageContent = String(req.body.pageContent);
  if (req.body.faqs !== undefined) update.faqs = normalizeFaqs(req.body.faqs);
  if (req.body.seo !== undefined) update.seo = normalizeSeo(req.body.seo);
  if (req.body.i18n !== undefined) update.i18n = normalizeI18n(req.body.i18n);
  if (req.body.sortOrder !== undefined) update.sortOrder = Number.isFinite(Number(req.body.sortOrder)) ? Number(req.body.sortOrder) : 0;
  if (req.body.active !== undefined) update.active = Boolean(req.body.active);

  if (req.body.slug !== undefined) {
    let slug = String(req.body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) slug = nameToSlug(update.name || existing.name);
    update.slug = await uniqueCategorySlug(existing.website, slug, existing._id);
  }

  const row = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
  res.status(200).json({ success: true, data: row });
});

exports.delete = asyncHandler(async (req, res) => {
  const n = await Site.countDocuments({ category: req.params.id });
  if (n > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete: ${n} site(s) use this category. Reassign sites or deactivate the category instead.`,
    });
  }
  const row = await Category.findByIdAndDelete(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  res.status(200).json({ success: true, message: 'Category deleted' });
});
