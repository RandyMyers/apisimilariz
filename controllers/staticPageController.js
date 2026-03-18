const StaticPage = require('../models/StaticPage');
const { asyncHandler } = require('../middleware/errorHandler');
const { applyI18n } = require('../utils/i18nMerge');

const PAGE_I18N_FIELDS = ['title', 'body'];
const PAGE_I18N_NESTED = ['seo'];

/** GET /api/pages/:slug */
exports.getBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  if (!slug) return res.status(400).json({ success: false, message: 'Slug is required' });

  const page = await StaticPage.findOne({ website: req.websiteId, slug }).lean();
  if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

  const locale = req.locale || null;
  const data = locale ? applyI18n(page, locale, PAGE_I18N_FIELDS, PAGE_I18N_NESTED) : { ...page, i18n: undefined };
  res.status(200).json({ success: true, data });
});

