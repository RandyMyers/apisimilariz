const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Website = require('../models/Website');
const Site = require('../models/Site');
const { allLocaleCodes } = require('../config/siteLocales');
const { domainToSlug, uniqueSlugForWebsite } = require('../utils/siteSlug');

async function ensureSiteSlugs() {
  const missing = await Site.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
  })
    .select('_id website domain')
    .lean();
  for (const row of missing) {
    const slug = await uniqueSlugForWebsite(row.website, domainToSlug(row.domain), row._id);
    await Site.updateOne({ _id: row._id }, { $set: { slug } });
  }
  if (missing.length) console.log(`Backfilled slug on ${missing.length} site(s).`);
}

const DEFAULT_SLUG = process.env.DEFAULT_WEBSITE_SLUG || 'similaris';
const DEFAULT_BASE_URL = (process.env.WEBSITE_BASE_URL || process.env.CLIENT_URL || 'https://ubiquitous-alfajores-f4baae.netlify.app').replace(/\/+$/, '');

const sitesWithDetails = [
  { domain: 'github.com', title: 'GitHub', description: "The world's leading software development platform for version control and collaboration.", category: 'Technology', tags: ['Development', 'Open Source', 'SaaS'], similarityScore: 98, alternativeRank: 1, alternativeTo: 'GitLab', trending: 'Top choice', userScore: 4.9, reviewCount: 2847, longDescription: "GitHub is the world's leading software development and version control platform. Millions of developers and companies build, ship, and maintain their software on GitHub. It offers unlimited private repositories, powerful collaboration tools, integrated CI/CD, and a vast ecosystem of integrations and actions. Whether you're open source or enterprise, GitHub provides the tools to ship better code together.", features: ['Unlimited public and private repos', 'Actions for CI/CD', 'Code review and pull requests', 'Issue tracking and projects', 'GitHub Pages', 'API and integrations'] },
  { domain: 'gitlab.com', title: 'GitLab', description: 'A complete DevOps platform delivered as a single application.', category: 'Technology', tags: ['Development', 'DevOps', 'CI/CD'], similarityScore: 94, alternativeRank: 1, alternativeTo: 'GitHub', trending: 'Rising', userScore: 4.6, reviewCount: 1203, longDescription: "GitLab is a complete DevOps platform delivered as a single application. It covers the entire software development lifecycle from planning and source code management to CI/CD, monitoring, and security. Teams can collaborate in one place with built-in version control, issue tracking, code review, and automated pipelines. GitLab is available as both a hosted service and self-managed installation.", features: ['Unified DevOps platform', 'Built-in CI/CD', 'Security and compliance', 'Issue and epic tracking', 'Container registry', 'Self-hosted option'] },
  { domain: 'bitbucket.org', title: 'Bitbucket', description: 'Git solution for teams using Jira, built by Atlassian.', category: 'Technology', tags: ['Development', 'Git', 'Atlassian'], similarityScore: 91, alternativeRank: 2, alternativeTo: 'GitHub', trending: 'Stable', userScore: 4.2, reviewCount: 892, longDescription: "Bitbucket is a Git-based code collaboration tool built for teams using Jira and the Atlassian suite. It provides Git repository hosting, pull requests, branch permissions, and pipelines. Bitbucket integrates tightly with Jira for traceability from commit to ticket, and supports both Git and Mercurial. It's designed for professional teams that need fine-grained access control and compliance.", features: ['Jira integration', 'Branch permissions', 'Bitbucket Pipelines', 'Built-in CI/CD', 'Free private repos', 'Mercurial support'] },
  { domain: 'stackoverflow.com', title: 'Stack Overflow', description: "The largest online community for developers to learn and share knowledge.", category: 'Technology', tags: ['Q&A', 'Development', 'Community'], similarityScore: 87, alternativeRank: 1, alternativeTo: 'GitHub', trending: 'Top choice', userScore: 4.7, reviewCount: 3156, longDescription: "Stack Overflow is the largest online community for programmers to learn, share knowledge, and advance their careers. Developers ask and answer questions on every topic from algorithms to frameworks. The Q&A format with voting and reputation encourages quality content. Stack Overflow for Teams offers private knowledge bases for companies. The site is a go-to resource for debugging, best practices, and technical discussion.", features: ['Q&A with voting', 'Tags and search', 'Reputation and badges', 'Stack Overflow for Teams', 'Job board', 'Documentation'] },
  { domain: 'codepen.io', title: 'CodePen', description: 'An online code editor and front-end development environment.', category: 'Technology', tags: ['Frontend', 'Playground', 'CSS'], similarityScore: 82, alternativeRank: 3, alternativeTo: 'GitHub', trending: 'Stable', userScore: 4.4, reviewCount: 567, longDescription: "CodePen is an online code editor and front-end development environment for building and sharing HTML, CSS, and JavaScript snippets. Developers create 'pens' to prototype ideas, showcase work, or find inspiration. It supports preprocessors, external resources, and collaborative features. CodePen is popular for demos, portfolios, and learning front-end techniques.", features: ['Live preview', 'Preprocessors', 'Assets and external CSS/JS', 'Collections', 'Embed and share', 'Community picks'] },
  { domain: 'stripe.com', title: 'Stripe', description: 'Online payment processing for internet businesses.', category: 'Finance', tags: ['Payments', 'API', 'SaaS'], similarityScore: 79, alternativeRank: 1, alternativeTo: 'Shopify', trending: 'Top choice', userScore: 4.8, reviewCount: 1923, longDescription: "Stripe provides payment processing and financial infrastructure for the internet. Businesses use Stripe to accept payments, send payouts, manage subscriptions, and handle compliance. The platform offers a unified API, pre-built UI components, and tools for fraud prevention and analytics. Stripe supports global payments in 135+ currencies and is used by startups and enterprises alike.", features: ['Payments API', 'Subscriptions and billing', 'Stripe Radar (fraud)', 'Stripe Atlas', 'Pre-built checkout', '135+ currencies'] },
  { domain: 'shopify.com', title: 'Shopify', description: "The leading e-commerce platform for online stores.", category: 'E-Commerce', tags: ['E-Commerce', 'SaaS', 'Retail'], similarityScore: 76, alternativeRank: 1, alternativeTo: 'Amazon', trending: 'Rising', userScore: 4.5, reviewCount: 2104, longDescription: "Shopify is the leading commerce platform that allows anyone to set up an online store and sell products. It provides storefronts, checkout, inventory and order management, and a large app store. Merchants can sell online, in person, and across social channels. Shopify handles hosting, security, and updates so businesses can focus on selling. Used by millions of stores worldwide.", features: ['Online store builder', 'POS and in-person', 'App store', 'Multi-channel sales', 'Inventory management', '24/7 support'] },
  { domain: 'figma.com', title: 'Figma', description: 'Collaborative interface design tool for teams.', category: 'Technology', tags: ['Design', 'Collaboration', 'UI/UX'], similarityScore: 73, alternativeRank: 1, alternativeTo: 'Notion', trending: 'Rising', userScore: 4.7, reviewCount: 1654, longDescription: "Figma is a collaborative interface design tool that runs in the browser. Designers create wireframes, prototypes, and high-fidelity mockups with real-time multiplayer editing. Developers can inspect specs and use plugins for handoff. Figma works across Mac, Windows, and Linux with no install required. It has become the standard for product and design teams at companies of all sizes.", features: ['Real-time collaboration', 'Prototyping', 'Design systems', 'Plugins and integrations', 'Dev mode', 'Figma for education'] },
  { domain: 'notion.so', title: 'Notion', description: 'The all-in-one workspace for notes, tasks, wikis, and databases.', category: 'Technology', tags: ['Productivity', 'Notes', 'Collaboration'], similarityScore: 70, alternativeRank: 2, alternativeTo: 'Figma', trending: 'Top choice', userScore: 4.6, reviewCount: 2231, longDescription: "Notion is an all-in-one workspace for notes, tasks, wikis, and databases. Users combine blocks of text, tables, boards, and more to build custom workflows. It supports team wikis, project trackers, and personal note-taking in one tool. Notion offers templates, API, and integrations with Slack and others. It's used by individuals and teams for documentation, planning, and knowledge management.", features: ['Blocks and databases', 'Templates gallery', 'Wikis and docs', 'Tasks and projects', 'API and integrations', 'Offline access'] },
  { domain: 'vercel.com', title: 'Vercel', description: 'The platform for frontend developers, providing speed and reliability.', category: 'Technology', tags: ['Hosting', 'Frontend', 'Jamstack'], similarityScore: 68, alternativeRank: 4, alternativeTo: 'GitHub', trending: 'Rising', userScore: 4.5, reviewCount: 876, longDescription: "Vercel is the platform for frontend developers, providing speed and reliability for modern web applications. Deploy static sites and serverless functions with zero config. Vercel optimizes for frameworks like Next.js, with edge network, analytics, and preview deployments for every push. Used by individuals and teams to ship production apps with minimal setup.", features: ['Zero-config deployments', 'Next.js optimized', 'Edge network', 'Preview URLs', 'Analytics', 'Serverless functions'] },
  { domain: 'amazon.com', title: 'Amazon', description: "The world's largest online marketplace for everything.", category: 'E-Commerce', tags: ['Marketplace', 'Retail', 'Cloud'], similarityScore: 65, alternativeRank: 1, alternativeTo: 'Shopify', trending: 'Stable', userScore: 4.3, reviewCount: 4521, longDescription: "Amazon is the world's largest online marketplace, offering millions of products across categories. It combines retail with Amazon Web Services (AWS), Prime membership, and media. Sellers use Amazon to reach global customers with fulfillment by Amazon (FBA). The platform is known for fast delivery, customer reviews, and a vast selection.", features: ['Marketplace and retail', 'Prime delivery', 'AWS cloud services', 'Seller central', 'Reviews and ratings', 'Subscribe & Save'] },
  { domain: 'reddit.com', title: 'Reddit', description: "The front page of the internet, a social news aggregation platform.", category: 'Social Media', tags: ['Community', 'Forum', 'News'], similarityScore: 62, alternativeRank: 2, alternativeTo: 'Stack Overflow', trending: 'Stable', userScore: 4.1, reviewCount: 3892, longDescription: "Reddit is a social news aggregation and discussion platform where users submit content and vote on posts and comments. Communities (subreddits) form around topics from technology to hobbies. Reddit's voting system surfaces the most relevant content. It's used for news, AMAs, support, and niche communities. Reddit also offers premium and moderation tools.", features: ['Subreddits and communities', 'Upvote/downvote', 'Awards and karma', 'Reddit Premium', 'Mod tools', 'API for developers'] },
];

async function getOrCreateWebsite() {
  let website = await Website.findOne({ slug: DEFAULT_SLUG });
  if (!website) {
    website = await Website.create({
      name: DEFAULT_SLUG === 'similaris' ? 'Similaris' : DEFAULT_SLUG,
      slug: DEFAULT_SLUG,
      baseUrl: DEFAULT_BASE_URL,
      supportedLocales: allLocaleCodes,
      defaultLocale: 'en-US',
    });
    console.log(`Created website: ${website.slug}`);
  } else {
    let changed = false;
    if (!website.baseUrl || website.baseUrl !== DEFAULT_BASE_URL) {
      website.baseUrl = DEFAULT_BASE_URL;
      changed = true;
      console.log(`Updated website baseUrl: ${website.slug} -> ${website.baseUrl}`);
    }
    const cur = JSON.stringify((website.supportedLocales || []).slice().sort());
    const next = JSON.stringify([...allLocaleCodes].slice().sort());
    if (cur !== next) {
      website.supportedLocales = allLocaleCodes;
      changed = true;
      console.log(`Updated website supportedLocales (${allLocaleCodes.length} locales) for sitemap/client parity`);
    }
    if (changed) await website.save();
  }
  return website._id;
}

async function run() {
  if (!process.env.MONGO_URL) {
    console.error('MONGO_URL is required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  await ensureSiteSlugs();
  const websiteId = await getOrCreateWebsite();
  const force = process.argv.includes('--force');
  const existing = await Site.countDocuments({ website: websiteId });
  if (existing > 0 && !force) {
    console.log(`Sites already exist for website "${DEFAULT_SLUG}". Run with --force to clear and re-seed.`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }
  if (existing > 0 && force) {
    await Site.deleteMany({ website: websiteId });
    console.log('Cleared existing sites for this website.');
  }
  const sites = await Promise.all(
    sitesWithDetails.map(async (s) => {
      const base = domainToSlug(s.domain);
      const slug = await uniqueSlugForWebsite(websiteId, base);
      return { ...s, website: websiteId, slug };
    })
  );
  await Site.insertMany(sites);
  console.log(`Seeded ${sites.length} sites for website "${DEFAULT_SLUG}".`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
