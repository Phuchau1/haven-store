const { BannerModel } = require('../models/Banner');

exports.getBanners = async (req, res, next) => {
    try {
        const banners = await BannerModel.find({ status: 'active' }).sort({ createdAt: -1 });
        res.json({ success: true, banners });
    } catch (error) {
        next(error);
    }
};
