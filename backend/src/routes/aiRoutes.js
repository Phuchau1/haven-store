const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, admin } = require('../middleware/auth');

router.post('/generate', protect, admin, aiController.generateContent);

module.exports = router;
