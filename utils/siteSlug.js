const Site = require('../models/Site');

function domainToSlug(domain) {
  return String(domain || '')
    .toLowerCase()
    .trim()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'site';
}

/**
 * Resolve public URL segment (slug or legacy domain e.g. stripe.com).
 */
async function findSiteBySlugOrDomain(websiteId, param) {
  const p = decodeURIComponent(String(param || '').trim());
  if (!p) return null;
  const lower = p.toLowerCase();
  let site = await Site.findOne({ website: websiteId, slug: lower }).lean();
  if (site) return site;
  site = await Site.findOne({ website: websiteId, domain: lower }).lean();
  return site;
}

/** Ensure unique slug per website; mutates candidate string. */
async function uniqueSlugForWebsite(websiteId, baseSlug, excludeId = null) {
  let slug = baseSlug;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = { website: websiteId, slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Site.findOne(q).select('_id').lean();
    if (!exists) return slug;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
}

module.exports = {
  domainToSlug,
  findSiteBySlugOrDomain,
  uniqueSlugForWebsite,
};
