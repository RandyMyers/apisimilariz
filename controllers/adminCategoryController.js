const mongoose = require('mongoose');
const Category = require('../models/Category');
const Site = require('../models/Site');
const Website = require('../models/Website');
const { asyncHandler } = require('../middleware/errorHandler');
const { nameToSlug, uniqueCategorySlug } = require('../utils/categorySlug');

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
