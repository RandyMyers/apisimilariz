/**
 * One-time migration: embedded campaign creatives -> AdCreative documents + ref assignments.
 * Run: node scripts/migrateAdCampaignCreativesToRefs.js
 * Requires MONGO_URL in server/.env (copied from app cwd: use from server/ directory).
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const AdCampaign = require('../models/AdCampaign');
const AdCreative = require('../models/AdCreative');

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error('MONGO_URL missing');
    process.exit(1);
  }
  await mongoose.connect(mongoUrl);
  const campaigns = await AdCampaign.find({}).lean();
  let migrated = 0;
  let skipped = 0;
  for (const c of campaigns) {
    const rows = c.creatives || [];
    if (!rows.length) {
      skipped += 1;
      continue;
    }
    const first = rows[0];
    if (first.creative) {
      skipped += 1;
      continue;
    }
    if (!first.destinationUrl) {
      console.warn('Campaign', c._id, 'has creatives but no destinationUrl on first row; skip');
      skipped += 1;
      continue;
    }
    const newAssignments = [];
    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx];
      const creative = await AdCreative.create({
        website: c.website,
        internalName: `${c.name || 'Campaign'} · creative ${idx + 1}`.slice(0, 200),
        type: row.type || 'image',
        title: row.title || '',
        description: row.description || '',
        imageUrl: row.imageUrl || '',
        imageWidth: row.imageWidth || null,
        imageHeight: row.imageHeight || null,
        ctaLabel: row.ctaLabel || '',
        destinationUrl: row.destinationUrl,
        createdBy: null,
        updatedBy: null,
      });
      newAssignments.push({
        creative: creative._id,
        isDefault: row.isDefault === true || idx === 0,
      });
    }
    let seen = false;
    newAssignments.forEach((a) => {
      if (a.isDefault) {
        if (seen) a.isDefault = false;
        else seen = true;
      }
    });
    if (!seen && newAssignments.length) newAssignments[0].isDefault = true;
    await AdCampaign.updateOne({ _id: c._id }, { $set: { creatives: newAssignments } });
    migrated += 1;
  }
  console.log('Done. Migrated:', migrated, 'Skipped (already refs or empty):', skipped);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
