const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');

// PUBLIC: Đăng ký nhận tin
router.post('/subscribe', newsletterController.subscribe);

// ADMIN: Lấy danh sách + xuất CSV + xóa
router.get('/subscribers', newsletterController.getSubscribers);
router.get('/export', newsletterController.exportSubscribers);
router.delete('/subscribers/:id', newsletterController.deleteSubscriber);

module.exports = router;
