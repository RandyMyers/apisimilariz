const express = require('express');
const router = express.Router();
const { create } = require('../controllers/reportController');
const { validateReport } = require('../middleware/validators/reportValidator');

router.post('/', validateReport, create);

module.exports = router;
