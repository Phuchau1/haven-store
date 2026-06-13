const { BannerModel } = require('../models/Banner');
const { ColorModel } = require('../models/Color');
const { SizeModel } = require('../models/Size');
const { CouponModel } = require('../models/Coupon');
const { PaymentMethodModel } = require('../models/PaymentMethod');
const { ShippingMethodModel } = require('../models/ShippingMethod');

// Helper to handle basic CRUD
const getModelByName = (name) => {
    switch(name) {
        case 'banners': return BannerModel;
        case 'colors': return ColorModel;
        case 'sizes': return SizeModel;
        case 'coupons': return CouponModel;
        case 'payment-methods': return PaymentMethodModel;
        case 'shipping-methods': return ShippingMethodModel;
        default: return null;
    }
};

exports.getAll = async (req, res) => {
    try {
        const { resource } = req.params;
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid resource' });

        const data = await Model.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { resource } = req.params;
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid resource' });

        const newItem = new Model(req.body);
        await newItem.save();
        res.status(201).json({ success: true, data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { resource } = req.params;
        const { id } = req.query; // using query param for id matching other routes
        
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid resource' });

        if (!id) return res.status(400).json({ success: false, message: 'ID is required' });

        const updatedItem = await Model.findOneAndUpdate(
            { id: id },
            req.body,
            { new: true }
        );

        if (!updatedItem) return res.status(404).json({ success: false, message: 'Not found' });
        
        res.status(200).json({ success: true, data: updatedItem });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { resource } = req.params;
        const { id } = req.query;
        
        const Model = getModelByName(resource);
        if (!Model) return res.status(400).json({ success: false, message: 'Invalid resource' });

        if (!id) return res.status(400).json({ success: false, message: 'ID is required' });

        const deletedItem = await Model.findOneAndDelete({ id: id });
        if (!deletedItem) return res.status(404).json({ success: false, message: 'Not found' });

        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
