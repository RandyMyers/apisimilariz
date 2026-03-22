const mongoose = require('mongoose');
const RemoveRequest = require('../models/RemoveRequest');
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
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status ? String(req.query.status).trim().toLowerCase() : '';

  const filter = { ...(websiteId ? { website: websiteId } : {}) };
  if (status && ['pending', 'approved', 'rejected'].includes(status)) filter.status = status;

  const [items, total] = await Promise.all([
    RemoveRequest.find(filter).populate('website', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    RemoveRequest.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total },
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const item = await RemoveRequest.findById(req.params.id).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'Remove request not found' });
  }
  res.status(200).json({ success: true, data: item });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !['pending', 'approved', 'rejected'].includes(String(status))) {
    return res.status(400).json({ success: false, message: 'Valid status (pending, approved, rejected) is required' });
  }
  const item = await RemoveRequest.findByIdAndUpdate(
    req.params.id,
    { status: String(status) },
    { new: true }
  ).lean();
  if (!item) {
    return res.status(404).json({ success: false, message: 'Remove request not found' });
  }
  res.status(200).json({ success: true, data: item });
});

exports.delete = asyncHandler(async (req, res) => {
  const item = await RemoveRequest.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Remove request not found' });
  }
  res.status(200).json({ success: true, message: 'Remove request deleted' });
});
