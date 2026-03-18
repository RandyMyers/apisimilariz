const mongoose = require('mongoose');
const Site = require('../models/Site');
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
  const category = req.query.category ? String(req.query.category).trim() : '';
  const q = req.query.q ? String(req.query.q).trim() : '';

  const filter = { website: websiteId };
  if (category) filter.category = category;
  if (q) {
    filter.$or = [
      { title: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { domain: new RegExp(q, 'i') },
      { category: new RegExp(q, 'i') },
    ];
  }

  const [sites, total] = await Promise.all([
    Site.find(filter).sort({ userScore: -1, domain: 1 }).skip(skip).limit(limit).lean(),
    Site.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: sites,
    pagination: { page, limit, total },
  });
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
  const site = await Site.create({
    ...req.body,
    website: websiteId,
    domain: (req.body.domain || '').trim().toLowerCase(),
  });
  res.status(201).json({ success: true, data: site });
});

exports.update = asyncHandler(async (req, res) => {
  const site = await Site.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      ...(req.body.domain !== undefined && { domain: String(req.body.domain).trim().toLowerCase() }),
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).lean();
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  res.status(200).json({ success: true, data: site });
});

exports.delete = asyncHandler(async (req, res) => {
  const site = await Site.findByIdAndDelete(req.params.id);
  if (!site) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }
  res.status(200).json({ success: true, message: 'Site deleted' });
});
