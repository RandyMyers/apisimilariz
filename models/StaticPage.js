const mongoose = require('mongoose');
const seoSchema = require('./schemas/seoSchema');

const staticPageI18nSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 200 },
    /** HTML (from Quill) */
    body: { type: String, default: '' },
    seo: seoSchema,
  },
  { _id: false }
);

const staticPageSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  /** Unique logical identifier used by client (e.g. 'about', 'privacy', 'terms', 'home') */
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    lowercase: true,
    maxlength: [64, 'Slug cannot exceed 64 characters'],
  },
  /** Route path segment ('' for home) without locale prefix. Examples: '', 'about', 'privacy', 'terms' */
  path: {
    type: String,
    required: [true, 'Path is required'],
    trim: true,
    default: '',
  },
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
  /** HTML (from Quill) */
  body: { type: String, default: '' },
  seo: { type: seoSchema, default: () => ({}) },
  i18n: {
    type: Map,
    of: staticPageI18nSchema,
    default: () => new Map(),
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

staticPageSchema.index({ website: 1, slug: 1 }, { unique: true });
staticPageSchema.index({ website: 1, path: 1 });

staticPageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const StaticPage = mongoose.model('StaticPage', staticPageSchema);
module.exports = StaticPage;

