const express = require('express');
const router = express.Router();
const { create } = require('../controllers/submitController');
const { validateSubmitSite } = require('../middleware/validators/submitValidator');

router.post('/', validateSubmitSite, create);

module.exports = router;
