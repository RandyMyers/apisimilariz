const mongoose = require('mongoose');

/** Distributed lease for cron-like jobs (multi-instance safe). */
const adSchedulerLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    lockedUntil: { type: Date, required: true },
    owner: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdSchedulerLock', adSchedulerLockSchema);
