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

exports.getStats = asyncHandler(async (req, res) => {
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
  ] = await Promise.all([
    Website.countDocuments(),
    Site.countDocuments(),
    SiteSubmission.countDocuments(),
    ContactMessage.countDocuments(),
    RemoveRequest.countDocuments(),
    NewsletterSubscription.countDocuments(),
    BlogPost.countDocuments(),
    FAQ.countDocuments(),
    SponsoredItem.countDocuments(),
    Review.countDocuments(),
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
    },
  });
});
