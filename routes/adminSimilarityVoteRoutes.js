const express = require('express');
const router = express.Router();
const { list } = require('../controllers/adminSimilarityVoteController');

router.get('/', list);

module.exports = router;
