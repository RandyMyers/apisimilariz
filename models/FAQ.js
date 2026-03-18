const mongoose = require('mongoose');
const seoSchema = require('./schemas/seoSchema');

const faqI18nSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, maxlength: 500 },
    answer: { type: String, trim: true },
    seo: seoSchema,
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters'],
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
  },
  seo: {
    type: seoSchema,
    default: () => ({}),
  },
  i18n: {
    type: Map,
    of: faqI18nSchema,
    default: () => new Map(),
  },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

faqSchema.index({ website: 1, order: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);
module.exports = FAQ;
