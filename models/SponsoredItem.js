const mongoose = require('mongoose');
const seoSchema = require('./schemas/seoSchema');

const sponsoredI18nSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    code: { type: String, trim: true },
    seo: seoSchema,
  },
  { _id: false }
);

const sponsoredItemSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['coupon', 'deal'],
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
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  code: { type: String, default: null, trim: true },
  link: { type: String, default: null, trim: true },
  expiry: { type: String, default: null, trim: true },
  seo: {
    type: seoSchema,
    default: () => ({}),
  },
  i18n: {
    type: Map,
    of: sponsoredI18nSchema,
    default: () => new Map(),
  },
  createdAt: { type: Date, default: Date.now },
});

sponsoredItemSchema.index({ website: 1, domain: 1 });

const SponsoredItem = mongoose.model('SponsoredItem', sponsoredItemSchema);
module.exports = SponsoredItem;
