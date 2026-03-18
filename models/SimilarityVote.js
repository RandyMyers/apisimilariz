const mongoose = require('mongoose');

const similarityVoteSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  /** The site we're viewing "similar to" (e.g. stripe.com) */
  mainDomain: {
    type: String,
    required: [true, 'Main domain is required'],
    trim: true,
    lowercase: true,
  },
  /** The alternative site being rated (e.g. shopify.com) */
  alternativeDomain: {
    type: String,
    required: [true, 'Alternative domain is required'],
    trim: true,
    lowercase: true,
  },
  /** 1-5 how similar the alternative is to the main */
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
  },
  /** Optional reason from the voter (why they think it's similar) */
  reason: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  /** Anti-spam: client IP when not logged in (or for audit). Set by server from req.ip */
  ip: {
    type: String,
    default: null,
    trim: true,
    maxlength: [45, 'IP cannot exceed 45 characters'],
  },
  /** User-Agent for abuse detection / rate limiting */
  userAgent: {
    type: String,
    default: null,
    trim: true,
    maxlength: [512, 'User-Agent truncated'],
  },
  createdAt: { type: Date, default: Date.now },
});

similarityVoteSchema.index({ website: 1, mainDomain: 1, alternativeDomain: 1 });
similarityVoteSchema.index({ website: 1, mainDomain: 1 });
similarityVoteSchema.index({ website: 1, ip: 1, createdAt: -1 });

const SimilarityVote = mongoose.model('SimilarityVote', similarityVoteSchema);
module.exports = SimilarityVote;
