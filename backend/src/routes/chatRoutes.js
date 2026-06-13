const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/session', chatController.createOrGetSession);
router.get('/sessions', chatController.getSessions);
router.get('/sessions/:sessionId/messages', chatController.getMessagesBySession);
router.post('/messages', chatController.sendMessage);
router.put('/sessions/:sessionId/close', chatController.closeSession);

module.exports = router;
