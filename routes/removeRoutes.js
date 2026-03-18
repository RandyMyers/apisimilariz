const express = require('express');
const router = express.Router();
const { create } = require('../controllers/removeController');
const { validateRemoveRequest } = require('../middleware/validators/removeValidator');

router.post('/', validateRemoveRequest, create);

module.exports = router;
