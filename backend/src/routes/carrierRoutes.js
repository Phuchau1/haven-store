const express = require('express');
const router = express.Router();
const carrierController = require('../controllers/carrierController');

// Lấy danh sách carriers hỗ trợ
router.get('/carriers', carrierController.getCarriers);

// Lấy tracking timeline của 1 đơn hàng (public — khách và admin đều xem)
router.get('/timeline/:orderId', carrierController.getTimeline);

// Admin: Khởi tạo giao hàng với carrier cụ thể
router.post('/init', carrierController.initShipping);

// Admin: Tiến 1 bước trong quá trình giao hàng
router.post('/advance', carrierController.advanceStep);

// Admin: Thêm custom tracking event thủ công
router.post('/add-event', carrierController.addEvent);

module.exports = router;
