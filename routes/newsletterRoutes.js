const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/newsletterController');
const { validateSubscribe } = require('../middleware/validators/newsletterValidator');

router.post('/subscribe', validateSubscribe, subscribe);

module.exports = router;
