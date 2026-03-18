const mongoose = require('mongoose');

/**
 * Reusable SEO subdocument for BlogPost, Site, FAQ, SponsoredItem, etc.
 * Used for meta title/description, canonical, robots, OG, Twitter, sitemap settings.
 */
const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 160 },
    /** Comma-separated; used for meta keywords where relevant */
    keywords: { type: String, trim: true, maxlength: 512 },
    canonicalPath: { type: String, trim: true },
    robots: { type: String, trim: true, enum: ['', 'index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'] },
    ogTitle: { type: String, trim: true, maxlength: 70 },
    ogDescription: { type: String, trim: true, maxlength: 200 },
    ogImage: { type: String, trim: true },
    twitterTitle: { type: String, trim: true, maxlength: 70 },
    twitterDescription: { type: String, trim: true, maxlength: 200 },
    twitterImage: { type: String, trim: true },
    sitemap: {
      include: { type: Boolean, default: true },
      priority: { type: Number, min: 0, max: 1, default: 0.5 },
      changefreq: { type: String, enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'], default: 'weekly' },
    },
  },
  { _id: false }
);

module.exports = seoSchema;
