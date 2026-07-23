/**
 * ============================================================
 * ROUTE: AI VIRTUAL TRY-ON
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const tryOnController = require('../controllers/tryOnController');

// Polling trạng thái Job
router.get('/job-status/:jobId', tryOnController.getJobStatus);

// Tạo Job thử đồ mới
router.post('/run', tryOnController.runTryOn);
router.post('/generate-job', tryOnController.runTryOn);
router.post('/', tryOnController.runTryOn);

module.exports = router;
