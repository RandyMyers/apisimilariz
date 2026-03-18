const express = require('express');
const router = express.Router();
const { list, getById, create, update, delete: deletePage, seedDefaults } = require('../controllers/adminStaticPageController');

router.get('/', list);
router.post('/seed-defaults', seedDefaults);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id', update);
router.delete('/:id', deletePage);

module.exports = router;

