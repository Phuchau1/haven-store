const express = require('express');
const router = express.Router();
const { getUserWallet, payWithWallet } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUserWallet);
router.post('/pay', protect, payWithWallet);

module.exports = router;
