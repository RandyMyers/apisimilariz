const express = require('express');
const router = express.Router();
const { list } = require('../controllers/faqController');

router.get('/', list);

module.exports = router;
