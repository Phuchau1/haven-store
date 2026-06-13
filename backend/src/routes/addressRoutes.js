const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

router.get('/', addressController.getAddresses);
router.post('/', addressController.addAddress);
router.put('/', addressController.updateAddress);
router.delete('/', addressController.deleteAddress);

module.exports = router;
