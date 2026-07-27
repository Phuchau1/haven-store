const express = require('express');
const router  = express.Router();
const crmController = require('../controllers/crmController');

router.get('/customers/:userId/360', crmController.getCustomer360);
router.post('/referral/claim',        crmController.claimReferral);

module.exports = router;
