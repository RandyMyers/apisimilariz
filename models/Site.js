const mongoose = require('mongoose');
const seoSchema = require('./schemas/seoSchema');

const siteI18nSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String },
    longDescription: { type: String },
    features: { type: [String], default: [] },
    seo: seoSchema,
    similarPageSeo: seoSchema,
  },
  { _id: false }
);

const siteSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  similarityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  alternativeRank: {
    type: Number,
    default: null,
  },
  alternativeTo: {
    type: String,
    default: null,
    trim: true,
  },
  trending: {
    type: String,
    default: 'Stable',
    enum: ['Top choice', 'Rising', 'Stable'],
  },
  userScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  longDescription: {
    type: String,
    default: '',
  },
  features: {
    type: [String],
    default: [],
  },
  seo: {
    type: seoSchema,
    default: () => ({}),
  },
  /** SEO for /similar/:domain (alternatives, “sites like X”) — separate from site detail /site/:domain */
  similarPageSeo: {
    type: seoSchema,
    default: () => ({}),
  },
  i18n: {
    type: Map,
    of: siteI18nSchema,
    default: () => new Map(),
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

siteSchema.index({ website: 1, domain: 1 }, { unique: true });
siteSchema.index({ website: 1, category: 1 });
siteSchema.index({ website: 1, userScore: -1, similarityScore: -1 });
siteSchema.index({ website: 1, title: 'text', description: 'text', tags: 'text' });

siteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Site = mongoose.model('Site', siteSchema);
module.exports = Site;
