const mongoose = require('mongoose');
const seoSchema = require('./schemas/seoSchema');

const blogPostI18nSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    excerpt: { type: String, trim: true },
    body: { type: String },
    seo: seoSchema,
  },
  { _id: false }
);

const blogPostSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    lowercase: true,
  },
  excerpt: {
    type: String,
    default: '',
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
  },
  body: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  seo: {
    type: seoSchema,
    default: () => ({}),
  },
  i18n: {
    type: Map,
    of: blogPostI18nSchema,
    default: () => new Map(),
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

blogPostSchema.index({ website: 1, slug: 1 }, { unique: true });
blogPostSchema.index({ website: 1, date: -1 });

blogPostSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
module.exports = BlogPost;
