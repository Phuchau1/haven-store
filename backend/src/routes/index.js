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
const cartRoutes = require('./cartRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const addressRoutes = require('./addressRoutes');
const bannerRoutes = require('./bannerRoutes');
const flashSaleRoutes = require('./flashSaleRoutes');
const paymentRoutes = require('./paymentRoutes');
const couponRoutes = require('./couponRoutes');
const articleRoutes = require('./articleRoutes');

// Public and Core Routes
const barcodeRoutes = require('./barcodeRoutes');
const luckyWheelRoutes = require('./luckyWheelRoutes');

const recentlyViewedRoutes = require('./recentlyViewedRoutes');
const loyaltyRoutes        = require('./loyaltyRoutes');
const analyticsRoutes      = require('./analyticsRoutes');
const aiRoutes             = require('./aiRoutes');

const crmRoutes          = require('./crmRoutes');

const carrierRoutes      = require('./carrierRoutes');      // Carrier Simulation Engine
const shippingRoutes     = require('./shippingRoutes');     // Mock Shipping API

const newsletterRoutes   = require('./newsletterRoutes');

router.use('/auth', authRoutes);
router.use('/shipping', shippingRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);   // ← Route đánh giá riêng biệt
router.use('/chats', chatRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/addresses', addressRoutes);
router.use('/banners', bannerRoutes);
router.use('/flash-sales', flashSaleRoutes);
router.use('/payment', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/articles', articleRoutes);
router.use('/lucky-wheel', luckyWheelRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/recently-viewed', recentlyViewedRoutes);
router.use('/loyalty',  loyaltyRoutes);   // Hệ thống điểm tích lũy
router.use('/analytics', analyticsRoutes); // Analytics & tracking
router.use('/crm',      crmRoutes);        // Enterprise CRM 360 & Referral
router.use('/carrier',  carrierRoutes);    // Carrier Simulation Engine (GHN/GHTK/J&T/VTP/BEST/NJV)
router.use('/barcode', barcodeRoutes);

const brandCollectionRoutes = require('./brandCollectionRoutes');

router.use('/', brandCollectionRoutes);

module.exports = router;
