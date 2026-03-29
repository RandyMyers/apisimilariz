const Category = require('../models/Category');

/** Human-readable name → URL slug (e.g. "E-Commerce" → "e-commerce") */
function nameToSlug(name) {
  return (
    String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'category'
  );
}

/**
 * Unique slug per website (append -2, -3 if needed).
 * @param {import('mongoose').Types.ObjectId} websiteId
 * @param {string} baseSlug
 * @param {import('mongoose').Types.ObjectId} [excludeId]
 */
async function uniqueCategorySlug(websiteId, baseSlug, excludeId) {
  let slug = baseSlug;
  let n = 0;
  for (;;) {
    const q = { website: websiteId, slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Category.findOne(q).select('_id').lean();
    if (!exists) return slug;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
}

module.exports = { nameToSlug, uniqueCategorySlug };
