const mongoose = require('mongoose');
const SponsoredItem = require('../models/SponsoredItem');
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
  const domain = req.query.domain ? String(req.query.domain).trim().toLowerCase() : '';

  const filter = { website: websiteId };
  if (domain) filter.domain = new RegExp(domain, 'i');

  const [items, total] = await Promise.all([
    SponsoredItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SponsoredItem.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total },
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const item = await SponsoredItem.findById(req.params.id).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'Sponsored item not found' });
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
  const item = await SponsoredItem.create({
    ...req.body,
    website: websiteId,
    domain: (req.body.domain || '').trim().toLowerCase(),
  });
  res.status(201).json({ success: true, data: item });
});

exports.update = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.domain !== undefined) updates.domain = String(updates.domain).trim().toLowerCase();
  const item = await SponsoredItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'Sponsored item not found' });
  }
  res.status(200).json({ success: true, data: item });
});

exports.delete = asyncHandler(async (req, res) => {
  const item = await SponsoredItem.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Sponsored item not found' });
  }
  res.status(200).json({ success: true, message: 'Sponsored item deleted' });
});
