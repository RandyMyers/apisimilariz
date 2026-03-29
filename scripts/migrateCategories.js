/**
 * One-time migration: Site.category string → Category documents + ObjectId refs.
 * Run AFTER deploying Category model: `node scripts/migrateCategories.js`
 * Safe to re-run (skips sites that already have ObjectId category).
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const SiteSubmission = require('../models/SiteSubmission');
const { nameToSlug, uniqueCategorySlug } = require('../utils/categorySlug');

function isObjectIdString(v) {
  return mongoose.Types.ObjectId.isValid(v) && String(new mongoose.Types.ObjectId(v)) === String(v);
}

async function ensureCategory(websiteId, name) {
  const n = String(name).trim();
  if (!n) return null;
  let cat = await Category.findOne({ website: websiteId, name: n }).lean();
  if (cat) return cat._id;
  const base = nameToSlug(n);
  const slug = await uniqueCategorySlug(websiteId, base);
  const created = await Category.create({
    website: websiteId,
    name: n,
    slug,
    sortOrder: 0,
    active: true,
  });
  return created._id;
}

async function run() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  const col = mongoose.connection.db.collection('sites');
  const sites = await col.find({}).toArray();
  let updated = 0;
  for (const doc of sites) {
    const c = doc.category;
    if (!c) continue;
    if (isObjectIdString(c)) continue;
    const wid = doc.website;
    if (!wid) continue;
    const catId = await ensureCategory(wid, c);
    if (!catId) continue;
    await col.updateOne({ _id: doc._id }, { $set: { category: catId } });
    updated += 1;
    console.log(`Site ${doc.domain || doc._id}: "${c}" → category ${catId}`);
  }

  const subName = SiteSubmission.collection.collectionName;
  const subs = mongoose.connection.db.collection(subName);
  try {
    const submissions = await subs.find({}).toArray();
    let subUp = 0;
    for (const doc of submissions) {
      const c = doc.category;
      if (!c) continue;
      if (isObjectIdString(c)) continue;
      const wid = doc.website;
      if (!wid) continue;
      const catId = await ensureCategory(wid, c);
      if (!catId) continue;
      await subs.updateOne({ _id: doc._id }, { $set: { category: catId } });
      subUp += 1;
    }
    if (subUp) console.log(`Updated ${subUp} submission(s).`);
  } catch (e) {
    console.warn('Submission migration skipped:', e.message);
  }

  console.log(`Done. Updated ${updated} site(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
