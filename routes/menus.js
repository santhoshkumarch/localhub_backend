const express = require('express');
const { getMenus, getMenuPosts, createMenu, updateMenu, deleteMenu, getAllLabels, getLabelPosts } = require('../controllers/menuController');
const router = express.Router();

router.get('/', getMenus);
router.post('/', createMenu);
router.put('/:id', updateMenu);
router.delete('/:id', deleteMenu);
router.get('/:id/posts', getMenuPosts);
router.get('/labels/all', getAllLabels);
router.get('/:menuId/labels/:labelName/posts', getLabelPosts);

module.exports = router;