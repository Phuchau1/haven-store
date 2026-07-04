const express = require('express');
const router = express.Router();
const { getRecentlyViewed, addRecentlyViewed } = require('../controllers/recentlyViewedController');

router.get('/', getRecentlyViewed);    // GET /api/recently-viewed?user_id=xxx
router.post('/', addRecentlyViewed);   // POST /api/recently-viewed

module.exports = router;
