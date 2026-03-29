/**
 * One-time migration: align production DB with client slug `citematch` and canonical URL.
 *
 * - If a Website with slug `citematch` exists: updates name + baseUrl (keeps _id; all child docs unchanged).
 * - Else if `similaris` exists: renames slug to `citematch` (same _id — refs stay valid).
 * - Else: creates a minimal `citematch` row (run full `seed.js` after if you need data).
 *
 * Usage (from server/):  node scripts/migrateWebsiteToCitematch.js
 * Requires: MONGO_URL in .env
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Website = require('../models/Website');
const { allLocaleCodes } = require('../config/siteLocales');

const TARGET_SLUG = 'citematch';
const TARGET_NAME = 'CiteMatch';
const TARGET_BASE = (process.env.WEBSITE_BASE_URL || process.env.CLIENT_URL || 'https://citematch.com').replace(
  /\/+$/,
  ''
);

async function run() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);

  const existing = await Website.findOne({ slug: TARGET_SLUG });
  if (existing) {
    const u = await Website.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: TARGET_NAME,
          baseUrl: TARGET_BASE,
          supportedLocales: allLocaleCodes,
          defaultLocale: existing.defaultLocale || 'en-US',
        },
      }
    );
    console.log(`Updated existing "${TARGET_SLUG}" website (matched ${u.matchedCount}, modified ${u.modifiedCount}).`);
    await mongoose.disconnect();
    return;
  }

  const legacy = await Website.findOne({ slug: 'similaris' });
  if (legacy) {
    await Website.updateOne(
      { _id: legacy._id },
      {
        $set: {
          slug: TARGET_SLUG,
          name: TARGET_NAME,
          baseUrl: TARGET_BASE,
          supportedLocales: legacy.supportedLocales?.length ? legacy.supportedLocales : allLocaleCodes,
        },
      }
    );
    console.log(`Renamed website similaris → ${TARGET_SLUG} (same _id; Site/Blog/etc. refs unchanged).`);
    await mongoose.disconnect();
    return;
  }

  await Website.create({
    name: TARGET_NAME,
    slug: TARGET_SLUG,
    baseUrl: TARGET_BASE,
    supportedLocales: allLocaleCodes,
    defaultLocale: 'en-US',
  });
  console.log(`Created new website "${TARGET_SLUG}". Seed data still empty — run: node scripts/seed.js`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
