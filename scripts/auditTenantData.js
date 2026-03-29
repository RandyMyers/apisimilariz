/**
 * Audit multi-tenant data after Website slug/default changes.
 *
 * - Lists every Website (slug, baseUrl, counts).
 * - Categories in this codebase are **per-website** (not global): Category.website is required.
 * - Flags Site rows whose category belongs to another website.
 * - Flags curatedSimilar entries pointing at sites under a different website.
 *
 * Usage (from server/):  node scripts/auditTenantData.js
 * Requires: MONGO_URL in .env
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Website = require('../models/Website');
const Site = require('../models/Site');
const Category = require('../models/Category');
const BlogPost = require('../models/BlogPost');
const FAQ = require('../models/FAQ');
const StaticPage = require('../models/StaticPage');
const SponsoredItem = require('../models/SponsoredItem');
const SiteSubmission = require('../models/SiteSubmission');

async function main() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);

  const websites = await Website.find().select('slug name baseUrl').sort({ slug: 1 }).lean();
  console.log('\n=== Websites ===\n');
  if (!websites.length) {
    console.log('No Website documents. Create one in Admin or run migrate/seed.');
    await mongoose.disconnect();
    return;
  }

  const widToSlug = new Map(websites.map((w) => [String(w._id), w.slug]));

  for (const w of websites) {
    const wid = w._id;
    const [sites, categories, blogs] = await Promise.all([
      Site.countDocuments({ website: wid }),
      Category.countDocuments({ website: wid }),
      BlogPost.countDocuments({ website: wid }),
    ]);
    const faq = await FAQ.countDocuments({ website: wid });
    const pages = await StaticPage.countDocuments({ website: wid });
    const sponsored = await SponsoredItem.countDocuments({ website: wid });
    const submissions = await SiteSubmission.countDocuments({ website: wid });

    console.log(`• ${w.slug}  (${w.name || 'no name'})`);
    console.log(`  _id: ${wid}`);
    console.log(`  baseUrl: ${w.baseUrl || '(empty)'}`);
    console.log(
      `  counts: sites=${sites}, categories=${categories}, blog=${blogs}, faq=${faq}, staticPages=${pages}, sponsored=${sponsored}, submissions=${submissions}`
    );
    console.log('');
  }

  console.log('=== Integrity checks ===\n');

  const allSites = await Site.find()
    .select('_id website domain slug category curatedSimilar')
    .lean();
  const allCats = await Category.find().select('_id website slug name').lean();
  const catById = new Map(allCats.map((c) => [String(c._id), c]));

  let badCategoryTenant = 0;
  const badCategorySamples = [];
  for (const s of allSites) {
    const cid = s.category && String(s.category);
    if (!cid) continue;
    const cat = catById.get(cid);
    if (!cat) {
      badCategoryTenant += 1;
      if (badCategorySamples.length < 15) {
        badCategorySamples.push({
          siteId: s._id,
          domain: s.domain,
          website: widToSlug.get(String(s.website)),
          missingCategoryId: cid,
        });
      }
      continue;
    }
    if (String(cat.website) !== String(s.website)) {
      badCategoryTenant += 1;
      if (badCategorySamples.length < 15) {
        badCategorySamples.push({
          siteId: s._id,
          domain: s.domain,
          siteWebsite: widToSlug.get(String(s.website)),
          categoryWebsite: widToSlug.get(String(cat.website)),
          categorySlug: cat.slug,
        });
      }
    }
  }

  if (badCategoryTenant === 0) {
    console.log('✓ Every Site.category points to a Category for the same website (or missing cat logged below).');
  } else {
    console.log(`✗ ${badCategoryTenant} site(s) have missing or cross-tenant category refs. Sample:`);
    console.log(JSON.stringify(badCategorySamples, null, 2));
  }

  let badCurated = 0;
  const badCuratedSamples = [];
  for (const s of allSites) {
    const list = s.curatedSimilar || [];
    for (const entry of list) {
      if (!entry || !entry.site) continue;
      const other = allSites.find((x) => String(x._id) === String(entry.site));
      if (!other) {
        badCurated += 1;
        if (badCuratedSamples.length < 15) {
          badCuratedSamples.push({
            parentDomain: s.domain,
            parentWebsite: widToSlug.get(String(s.website)),
            missingRef: String(entry.site),
          });
        }
        continue;
      }
      if (String(other.website) !== String(s.website)) {
        badCurated += 1;
        if (badCuratedSamples.length < 15) {
          badCuratedSamples.push({
            parentDomain: s.domain,
            parentWebsite: widToSlug.get(String(s.website)),
            pointsToDomain: other.domain,
            pointsToWebsite: widToSlug.get(String(other.website)),
          });
        }
      }
    }
  }

  if (badCurated === 0) {
    console.log('✓ curatedSimilar only references Site documents on the same website.');
  } else {
    console.log(`✗ ${badCurated} curatedSimilar ref(s) broken or cross-tenant. Sample:`);
    console.log(JSON.stringify(badCuratedSamples, null, 2));
  }

  const orphanSites = await Site.countDocuments({
    website: { $nin: websites.map((w) => w._id) },
  });
  if (orphanSites) {
    console.log(`✗ ${orphanSites} site(s) reference a deleted/missing Website id.`);
  } else {
    console.log('✓ No sites pointing at unknown Website ids.');
  }

  const orphanCats = await Category.countDocuments({
    website: { $nin: websites.map((w) => w._id) },
  });
  if (orphanCats) {
    console.log(`✗ ${orphanCats} categor(ies) reference a missing Website id.`);
  } else {
    console.log('✓ No categories pointing at unknown Website ids.');
  }

  console.log('\n=== Notes ===');
  console.log(
    '• Changing DEFAULT_WEBSITE_SLUG / env only affects requests without X-Website-Slug; it does not move data.'
  );
  console.log('• Renaming Website.slug (same document _id) keeps all refs valid; no ref migration needed.');
  console.log('• Categories are per-website in this schema (not global). Duplicate names per tenant are OK; slug is unique per website.\n');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
