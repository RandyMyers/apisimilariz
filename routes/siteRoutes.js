const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  list,
  getByDomain,
  getTop,
  getCategories,
  getSponsoredByDomain,
  getSimilarWithVotes,
  submitSimilarityVote,
} = require('../controllers/siteController');
const { listByDomain, create } = require('../controllers/reviewController');
const { validateCreateReview } = require('../middleware/validators/reviewValidator');
const { optionalProtect } = require('../middleware/auth');

/** Anti-spam: max 20 similarity votes per IP per 15 minutes */
const similarityVoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many votes. Please try again later.' },
  standardHeaders: true,
  keyGenerator: (req) => (req.ip || req.connection?.remoteAddress || 'unknown').toString(),
});

router.get('/categories', getCategories);
router.get('/top', getTop);
router.get('/', list);
router.get('/:domain/similar', getSimilarWithVotes);
router.post('/:domain/similarity-vote', similarityVoteLimiter, optionalProtect, submitSimilarityVote);
router.get('/:domain/reviews', listByDomain);
router.post('/:domain/reviews', optionalProtect, validateCreateReview, create);
router.get('/:domain/sponsored', getSponsoredByDomain);
router.get('/:domain', getByDomain);

module.exports = router;
