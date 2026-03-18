const BlogPost = require('../models/BlogPost');
const { asyncHandler } = require('../middleware/errorHandler');
const { applyI18n } = require('../utils/i18nMerge');

const BLOG_I18N_FIELDS = ['title', 'slug', 'excerpt', 'body'];
const BLOG_I18N_NESTED = ['seo'];

exports.list = asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ website: req.websiteId })
    .sort({ date: -1 })
    .select('title slug excerpt date i18n')
    .lean();
  const locale = req.locale || null;
  const data = posts.map((p) =>
    locale ? applyI18n(p, locale, BLOG_I18N_FIELDS, BLOG_I18N_NESTED) : (p && { ...p, i18n: undefined }) || p
  );
  res.status(200).json({ success: true, data });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const slug = (req.params.slug || '').trim().toLowerCase();
  const post = await BlogPost.findOne({ website: req.websiteId, slug }).lean();
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  const locale = req.locale || null;
  const data = locale ? applyI18n(post, locale, BLOG_I18N_FIELDS, BLOG_I18N_NESTED) : { ...post, i18n: undefined };
  res.status(200).json({ success: true, data });
});
