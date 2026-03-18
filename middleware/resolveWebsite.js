const Website = require('../models/Website');
const { asyncHandler } = require('./errorHandler');

/**
 * Resolve website from X-Website-Slug header (or query ?website=slug).
 * Sets req.website (document). Uses DEFAULT_WEBSITE_SLUG env if no header/query; 400 if slug unknown.
 * Use this middleware on all routes that need website-scoped data.
 */
const resolveWebsite = asyncHandler(async (req, res, next) => {
  const slug =
    (req.headers['x-website-slug'] || req.query.website || process.env.DEFAULT_WEBSITE_SLUG || 'similaris')
      .trim()
      .toLowerCase();
  const website = await Website.findOne({ slug }).lean();
  if (!website) {
    return res.status(400).json({
      success: false,
      message: `Unknown website: ${slug}. Provide a valid X-Website-Slug header or ?website=slug.`,
    });
  }
  req.website = website;
  req.websiteId = website._id;
  next();
});

module.exports = resolveWebsite;
