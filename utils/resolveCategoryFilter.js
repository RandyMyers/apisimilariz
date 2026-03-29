const mongoose = require('mongoose');
const Category = require('../models/Category');

/**
 * Resolve ?category= from slug, ObjectId, or legacy exact name (for old bookmarks).
 * @returns {Promise<import('mongoose').Types.ObjectId|null>}
 */
async function resolveCategoryIdForWebsite(websiteId, raw) {
  if (!raw || !String(raw).trim()) return null;
  const t = String(raw).trim();

  if (mongoose.Types.ObjectId.isValid(t) && String(new mongoose.Types.ObjectId(t)) === t) {
    const c = await Category.findOne({ _id: t, website: websiteId, active: true }).select('_id').lean();
    return c ? c._id : null;
  }

  const lower = t.toLowerCase();
  const bySlug = await Category.findOne({ website: websiteId, slug: lower, active: true }).select('_id').lean();
  if (bySlug) return bySlug._id;

  const byName = await Category.findOne({
    website: websiteId,
    name: new RegExp(`^${escapeRegex(t)}$`, 'i'),
    active: true,
  })
    .select('_id')
    .lean();
  return byName ? byName._id : null;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { resolveCategoryIdForWebsite, escapeRegex };
