const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');
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
  if (websiteParam && !websiteId) {
    return res.status(400).json({ success: false, message: 'Invalid website (id or slug)' });
  }
  const filter = websiteId ? { website: websiteId } : {};
  const items = await FAQ.find(filter).populate('website', 'name slug').sort({ order: 1, createdAt: 1 }).lean();
  res.status(200).json({ success: true, data: items });
});

exports.getById = asyncHandler(async (req, res) => {
  const item = await FAQ.findById(req.params.id).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'FAQ not found' });
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
  const item = await FAQ.create({ ...req.body, website: websiteId });
  res.status(201).json({ success: true, data: item });
});

exports.update = asyncHandler(async (req, res) => {
  const item = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'FAQ not found' });
  }
  res.status(200).json({ success: true, data: item });
});

exports.delete = asyncHandler(async (req, res) => {
  const item = await FAQ.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'FAQ not found' });
  }
  res.status(200).json({ success: true, message: 'FAQ deleted' });
});
