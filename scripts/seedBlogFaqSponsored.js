const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Website = require('../models/Website');
const BlogPost = require('../models/BlogPost');
const FAQ = require('../models/FAQ');
const SponsoredItem = require('../models/SponsoredItem');

const DEFAULT_SLUG = process.env.DEFAULT_WEBSITE_SLUG || 'similaris';
const DEFAULT_BASE_URL = (process.env.WEBSITE_BASE_URL || process.env.CLIENT_URL || 'https://ubiquitous-alfajores-f4baae.netlify.app').replace(/\/+$/, '');

async function getOrCreateWebsite() {
  let website = await Website.findOne({ slug: DEFAULT_SLUG });
  if (!website) {
    website = await Website.create({
      name: DEFAULT_SLUG === 'similaris' ? 'Similaris' : DEFAULT_SLUG,
      slug: DEFAULT_SLUG,
      baseUrl: DEFAULT_BASE_URL,
    });
    console.log(`Created website: ${website.slug}`);
  } else if (!website.baseUrl || website.baseUrl !== DEFAULT_BASE_URL) {
    website.baseUrl = DEFAULT_BASE_URL;
    await website.save();
    console.log(`Updated website baseUrl: ${website.slug} -> ${website.baseUrl}`);
  }
  return website._id;
}

const blogPosts = [
  { title: 'Introducing Similaris: Find Alternatives That Matter', slug: 'introducing-similaris', date: new Date('2025-03-01'), excerpt: "We built Similaris so you can discover sites ranked by what users think—not by traffic. Here's how it works.", body: 'Similaris is a new kind of discovery engine. Instead of ranking sites by monthly visits or ad spend, we focus on community ratings, similarity, and momentum.\n\nWhen you search for a site or browse categories, you see alternatives that other users have rated and that our system identifies as similar. You can compare two sites side by side, read reviews, and submit new sites—including marking them as alternatives to existing ones.\n\nWe hope this helps you find better alternatives and hidden gems across the web.' },
  { title: 'How We Rank Top Sites (Without Traffic)', slug: 'how-we-rank-top-sites', date: new Date('2025-02-15'), excerpt: "Our Top Sites list is ordered by user score, similarity, and momentum—not by traffic. Here's the logic.", body: 'Lots of "top sites" lists are really "most visited" lists. We do something different.\n\nOn Similaris, the Top Sites page ranks by:\n\n• **User score** — The average rating from community reviews (e.g. 4.6/5).\n• **Similarity and relevance** — How well a site matches what people are looking for in that category.\n• **Momentum** — Whether a site is Rising, Stable, or a Top choice based on recent engagement and ratings.\n\nNo traffic data, no pay-to-rank. Just what the community and our signals say about quality and relevance.' },
  { title: 'Submit Your Site and Help Others Discover It', slug: 'submit-your-site', date: new Date('2025-02-01'), excerpt: 'Submitting a site is free and quick. You can also tell us which site it\'s an alternative to—that helps everyone find better options.', body: 'If your site (or a site you love) isn\'t in our index yet, you can add it in a few steps.\n\nGo to Submit a Site and enter the domain, a short description, and a category. Optionally, choose "Alternative to" and pick an existing site from our list. That helps us show your site when people look for alternatives to that product or service.\n\nWe review submissions and add them to the index. Your submission and optional "alternative to" choice directly support how we rank and recommend sites.' },
];

const faqItems = [
  { question: 'What is Similaris?', answer: 'Similaris is a site discovery engine that helps you find websites similar to ones you already know. Search by domain or keyword, browse by category, compare sites side by side, and see how the community rates alternatives. We rank by rating and relevance, not traffic.', order: 1 },
  { question: 'How are "similar" sites determined?', answer: 'We use a combination of signals: category, tags, how users describe sites, and which sites are submitted as "alternatives to" others. User ratings and reviews also influence rankings. Over time, our index reflects both algorithmic similarity and community preference.', order: 2 },
  { question: 'Can I submit a website?', answer: 'Yes. Go to Submit a Site and enter the domain, a short description, category, and optionally which existing site it is an alternative to. We review submissions and add them to the index. Your email helps us follow up if needed.', order: 3 },
  { question: 'How do I report wrong or outdated information?', answer: "On any website detail page, use the \"Report wrong info\" link at the bottom. Describe what's incorrect and we'll review and update the listing.", order: 4 },
  { question: 'Do you use traffic or visit data for ranking?', answer: 'No. Top sites and search results are ranked by community rating, similarity score, and momentum (e.g. Rising, Top choice)—not by traffic or monthly visits. We focus on quality and relevance as voted by users.', order: 5 },
  { question: 'Is Similaris free to use?', answer: 'Yes. Browsing, searching, comparing, and submitting sites are free. We may offer premium features later; any changes will be announced and reflected in our Terms and Privacy policy.', order: 6 },
];

const sponsoredItems = [
  { domain: 'stripe.com', type: 'coupon', title: 'Stripe fee waiver', description: 'Waive processing fees for your first $10k in volume.', code: 'SIMILARIS10K', link: 'https://stripe.com', expiry: 'Dec 31, 2025' },
  { domain: 'stripe.com', type: 'deal', title: 'Startup Atlas', description: 'Incorporate your company with Stripe Atlas and get 6 months of Stripe fee discounts.', code: null, link: 'https://stripe.com/atlas', expiry: null },
  { domain: 'shopify.com', type: 'coupon', title: 'Shopify trial extension', description: 'Extend your free trial to 90 days when you sign up through our link.', code: 'SIMILARIS90', link: 'https://shopify.com', expiry: 'Ongoing' },
  { domain: 'shopify.com', type: 'deal', title: 'First month $1', description: 'Get your first month of Shopify for $1. No credit card required for trial.', code: null, link: 'https://shopify.com', expiry: null },
  { domain: 'github.com', type: 'deal', title: 'GitHub Pro for students', description: 'Get GitHub Pro and select partner benefits free with the Student Developer Pack.', code: null, link: 'https://education.github.com', expiry: null },
  { domain: 'figma.com', type: 'coupon', title: 'Figma Professional trial', description: 'Try Figma Professional free for 30 days. No card required.', code: 'FIGMA30', link: 'https://figma.com', expiry: 'Ongoing' },
  { domain: 'notion.so', type: 'deal', title: 'Notion for education', description: 'Notion Plus free for students and educators. Verify with your school email.', code: null, link: 'https://notion.so', expiry: null },
];

async function run() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  const websiteId = await getOrCreateWebsite();
  const force = process.argv.includes('--force');

  const blogWithWebsite = blogPosts.map((p) => ({ ...p, website: websiteId }));
  if ((await BlogPost.countDocuments({ website: websiteId })) === 0 || force) {
    if (force) await BlogPost.deleteMany({ website: websiteId });
    await BlogPost.insertMany(blogWithWebsite);
    console.log(`Seeded ${blogWithWebsite.length} blog posts for website "${DEFAULT_SLUG}".`);
  } else {
    console.log('Blog posts already exist for this website. Use --force to re-seed.');
  }

  const faqWithWebsite = faqItems.map((f) => ({ ...f, website: websiteId }));
  if ((await FAQ.countDocuments({ website: websiteId })) === 0 || force) {
    if (force) await FAQ.deleteMany({ website: websiteId });
    await FAQ.insertMany(faqWithWebsite);
    console.log(`Seeded ${faqWithWebsite.length} FAQ items for website "${DEFAULT_SLUG}".`);
  } else {
    console.log('FAQ items already exist for this website. Use --force to re-seed.');
  }

  const sponsoredWithWebsite = sponsoredItems.map((s) => ({ ...s, website: websiteId }));
  if ((await SponsoredItem.countDocuments({ website: websiteId })) === 0 || force) {
    if (force) await SponsoredItem.deleteMany({ website: websiteId });
    await SponsoredItem.insertMany(sponsoredWithWebsite);
    console.log(`Seeded ${sponsoredWithWebsite.length} sponsored items for website "${DEFAULT_SLUG}".`);
  } else {
    console.log('Sponsored items already exist for this website. Use --force to re-seed.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
