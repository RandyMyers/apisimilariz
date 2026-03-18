const express = require('express');
const router = express.Router();
const { create } = require('../controllers/contactController');
const { validateContact } = require('../middleware/validators/contactValidator');

router.post('/', validateContact, create);

module.exports = router;
