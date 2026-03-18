const express = require('express');
const router = express.Router();
const { list, getById, create, update, delete: deleteBlog } = require('../controllers/adminBlogController');

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id', update);
router.delete('/:id', deleteBlog);

module.exports = router;
