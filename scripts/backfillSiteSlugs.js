/**
 * One-off or seed: set Site.slug from domain (stripe.com → stripe-com) with uniqueness per website.
 * Usage: node scripts/backfillSiteSlugs.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Site = require('../models/Site');
const { domainToSlug, uniqueSlugForWebsite } = require('../utils/siteSlug');

async function run() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  const missing = await Site.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  })
    .select('_id website domain')
    .lean();
  let n = 0;
  for (const row of missing) {
    const slug = await uniqueSlugForWebsite(row.website, domainToSlug(row.domain), row._id);
    await Site.updateOne({ _id: row._id }, { $set: { slug } });
    n += 1;
  }
  console.log(n ? `Backfilled slug on ${n} site(s).` : 'All sites already have slugs.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
