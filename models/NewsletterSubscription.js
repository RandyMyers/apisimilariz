const mongoose = require('mongoose');

const newsletterSubscriptionSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
  },
  createdAt: { type: Date, default: Date.now },
});

newsletterSubscriptionSchema.index({ website: 1, email: 1 }, { unique: true });

const NewsletterSubscription = mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);
module.exports = NewsletterSubscription;
