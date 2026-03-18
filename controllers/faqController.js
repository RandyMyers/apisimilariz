const FAQ = require('../models/FAQ');
const { asyncHandler } = require('../middleware/errorHandler');
const { applyI18n } = require('../utils/i18nMerge');

const FAQ_I18N_FIELDS = ['question', 'answer'];
const FAQ_I18N_NESTED = ['seo'];

exports.list = asyncHandler(async (req, res) => {
  const items = await FAQ.find({ website: req.websiteId }).sort({ order: 1 }).lean();
  const locale = req.locale || null;
  const data = locale
    ? items.map((x) => applyI18n(x, locale, FAQ_I18N_FIELDS, FAQ_I18N_NESTED))
    : items.map((x) => ({ ...x, i18n: undefined }));
  res.status(200).json({ success: true, data });
});
