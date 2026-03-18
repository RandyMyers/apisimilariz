const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'],
  },
  baseUrl: {
    type: String,
    trim: true,
    default: '',
  },
  defaultLocale: {
    type: String,
    trim: true,
    default: 'en-US',
  },
  supportedLocales: {
    type: [String],
    default: ['en-US'],
  },
  localePathMap: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

websiteSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Website = mongoose.model('Website', websiteSchema);
module.exports = Website;
