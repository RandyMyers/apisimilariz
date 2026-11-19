const mongoose = require('mongoose');
const seoSchema = require('./schemas/seoSchema');

const categoryFaqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, maxlength: 300, default: '' },
    answer: { type: String, trim: true, maxlength: 3000, default: '' },
  },
  { _id: false }
);

const categoryI18nSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    slug: { type: String, trim: true, lowercase: true, match: /^[a-z0-9]+(-[a-z0-9]+)*$/ },
    description: { type: String, maxlength: 2000 },
    intro: { type: String, maxlength: 1000 },
    pageContent: { type: String },
    imageAlt: { type: String, maxlength: 160 },
    faqs: { type: [categoryFaqSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    website: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    /** URL segment for /categories/:slug and API filters — unique per website */
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    image: { type: String, trim: true, default: '', maxlength: 1000 },
    imageAlt: { type: String, trim: true, default: '', maxlength: 160 },
    intro: { type: String, trim: true, default: '', maxlength: 1000 },
    pageContent: { type: String, default: '' },
    faqs: { type: [categoryFaqSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
    i18n: { type: Map, of: categoryI18nSchema, default: () => new Map() },
    sortOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

categorySchema.index({ website: 1, slug: 1 }, { unique: true });
categorySchema.index({ website: 1, active: 1, sortOrder: 1 });

categorySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
