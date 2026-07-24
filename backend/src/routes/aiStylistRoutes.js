/**
 * ============================================================
 * ROUTE: AI STYLIST & RECOMMENDATION SYSTEM
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const aiStylistController = require('../controllers/aiStylistController');

router.post('/analyze',         aiStylistController.analyzeBodyAndStyle);
router.post('/recommendations', aiStylistController.getRecommendations);
router.post('/chat',            aiStylistController.chatStylist);
router.post('/interaction',     aiStylistController.trackInteraction);

module.exports = router;
