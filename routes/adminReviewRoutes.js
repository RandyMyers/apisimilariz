const express = require('express');
const router = express.Router();
const { list, delete: deleteReview } = require('../controllers/adminReviewController');

router.get('/', list);
router.delete('/:id', deleteReview);

module.exports = router;

