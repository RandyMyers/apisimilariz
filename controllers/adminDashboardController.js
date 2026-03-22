const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const Website = require('../models/Website');
const Site = require('../models/Site');
const SiteSubmission = require('../models/SiteSubmission');
const ContactMessage = require('../models/ContactMessage');
const RemoveRequest = require('../models/RemoveRequest');
const NewsletterSubscription = require('../models/NewsletterSubscription');
const BlogPost = require('../models/BlogPost');
const FAQ = require('../models/FAQ');
const SponsoredItem = require('../models/SponsoredItem');
const Review = require('../models/Review');
const StaticPage = require('../models/StaticPage');
const SimilarityVote = require('../models/SimilarityVote');

const resolveWebsiteId = async (websiteParam) => {
  if (!websiteParam) return null;
  if (mongoose.Types.ObjectId.isValid(websiteParam) && String(new mongoose.Types.ObjectId(websiteParam)) === websiteParam) {
    return websiteParam;
  }
  const w = await Website.findOne({ slug: String(websiteParam).trim().toLowerCase() }).select('_id').lean();
  return w ? w._id : null;
};

exports.getStats = asyncHandler(async (req, res) => {
  const websiteParam = req.query.website;
  const websiteId = websiteParam ? await resolveWebsiteId(websiteParam) : null;
  if (websiteParam && !websiteId) {
    return res.status(400).json({ success: false, message: 'Invalid website (id or slug)' });
  }

  const wFilter = websiteId ? { _id: websiteId } : {};
  const scoped = websiteId ? { website: websiteId } : {};

  const [
    websites,
    sites,
    submissions,
    contactMessages,
    removeRequests,
    newsletterSubscriptions,
    blogPosts,
    faqs,
    sponsoredItems,
    reviews,
    staticPages,
    similarityVotes,
  ] = await Promise.all([
    Website.countDocuments(wFilter),
    Site.countDocuments(scoped),
    SiteSubmission.countDocuments(scoped),
    ContactMessage.countDocuments(scoped),
    RemoveRequest.countDocuments(scoped),
    NewsletterSubscription.countDocuments(scoped),
    BlogPost.countDocuments(scoped),
    FAQ.countDocuments(scoped),
    SponsoredItem.countDocuments(scoped),
    Review.countDocuments(scoped),
    StaticPage.countDocuments(scoped),
    SimilarityVote.countDocuments(scoped),
  ]);

  res.status(200).json({
    success: true,
    data: {
      websites,
      sites,
      submissions,
      contactMessages,
      removeRequests,
      newsletterSubscriptions,
      blogPosts,
      faqs,
      sponsoredItems,
      reviews,
      staticPages,
      similarityVotes,
    },
  });
});
