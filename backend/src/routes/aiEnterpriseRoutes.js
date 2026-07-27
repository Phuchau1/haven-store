const express = require('express');
const router  = express.Router();
const aiEnterpriseController = require('../controllers/aiEnterpriseController');

router.post('/generate-description', aiEnterpriseController.generateDescription);
router.post('/detect-fraud',         aiEnterpriseController.detectFraud);
router.post('/forecast-demand',      aiEnterpriseController.forecastDemand);

module.exports = router;
