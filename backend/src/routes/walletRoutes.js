const express = require('express');
const router = express.Router();
const { getUserWallet, payWithWallet } = require('../controllers/walletController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, getUserWallet);
router.post('/pay', verifyToken, payWithWallet);

module.exports = router;
