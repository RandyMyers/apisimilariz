const mongoose = require('mongoose');

const adEventSchema = new mongoose.Schema(
  {
    website: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign', required: true, index: true },
    eventType: { type: String, enum: ['impression', 'click'], required: true, index: true },
    page: { type: String, trim: true, lowercase: true, default: '' },
    placement: { type: String, trim: true, lowercase: true, default: '' },
    domain: { type: String, trim: true, lowercase: true, default: '' },
    locale: { type: String, trim: true, lowercase: true, default: '' },
    country: { type: String, trim: true, lowercase: true, default: '', maxlength: 2 },
    device: { type: String, trim: true, lowercase: true, default: '' },
    ip: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    /** Optional idempotency key (client hash); duplicate keys per website are ignored. */
    eventKey: { type: String, trim: true, maxlength: 256, default: null },
  },
  { timestamps: true }
);

adEventSchema.index({ campaign: 1, eventType: 1, createdAt: -1 });
adEventSchema.index({ website: 1, createdAt: -1 });
adEventSchema.index({ website: 1, country: 1, createdAt: -1 });
adEventSchema.index({ website: 1, eventKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AdEvent', adEventSchema);
