const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
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
  const websiteId = await resolveWebsiteId(req.query.website);
  if (!websiteId) {
    return res.status(400).json({ success: false, message: 'Query "website" (id or slug) is required' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { website: websiteId };

  const [items, total] = await Promise.all([
    BlogPost.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total },
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const item = await BlogPost.findById(req.params.id).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'Blog post not found' });
  }
  res.status(200).json({ success: true, data: item });
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
  const slug = (req.body.slug || '').trim().toLowerCase() || (req.body.title || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const item = await BlogPost.create({
    ...req.body,
    website: websiteId,
    slug: slug || 'post-' + Date.now(),
  });
  res.status(201).json({ success: true, data: item });
});

exports.update = asyncHandler(async (req, res) => {
  const updates = { ...req.body, updatedAt: new Date() };
  if (updates.slug !== undefined) updates.slug = String(updates.slug).trim().toLowerCase();
  const item = await BlogPost.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'Blog post not found' });
  }
  res.status(200).json({ success: true, data: item });
});

exports.delete = asyncHandler(async (req, res) => {
  const item = await BlogPost.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Blog post not found' });
  }
  res.status(200).json({ success: true, message: 'Blog post deleted' });
});
