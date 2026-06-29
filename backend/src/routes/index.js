const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const uploadRoutes = require('./uploadRoutes');
const settingRoutes = require('./settingRoutes');
const categoryRoutes = require('./categoryRoutes');
const reviewRoutes = require('./reviewRoutes');
const chatRoutes = require('./chatRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const cartRoutes = require('./cartRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const addressRoutes = require('./addressRoutes');
const bannerRoutes = require('./bannerRoutes');
const flashSaleRoutes = require('./flashSaleRoutes');
const paymentRoutes = require('./paymentRoutes');
const couponRoutes = require('./couponRoutes');
const articleRoutes = require('./articleRoutes');

// WMS Routes
const menuRoutes = require('./menuRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const supplierRoutes = require('./supplierRoutes');
const stockReceiptRoutes = require('./stockReceiptRoutes');
const poRoutes = require('./poRoutes');
const inventoryReportRoutes = require('./inventoryReportRoutes');
const barcodeRoutes = require('./barcodeRoutes');
const exportRoutes = require('./exportRoutes');
const aiRoutes = require('./aiRoutes');
const luckyWheelRoutes = require('./luckyWheelRoutes');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);   // ← Route đánh giá riêng biệt
router.use('/chats', chatRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/addresses', addressRoutes);
router.use('/banners', bannerRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/payment', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/articles', articleRoutes);
router.use('/export', exportRoutes);
router.use('/ai', aiRoutes);
router.use('/lucky-wheel', luckyWheelRoutes);

// WMS API
router.use('/menus', menuRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/stock-receipts', stockReceiptRoutes);
router.use('/purchase-orders', poRoutes);
router.use('/inventory-reports', inventoryReportRoutes);
router.use('/barcode', barcodeRoutes);
router.use('/export', exportRoutes);

module.exports = router;
