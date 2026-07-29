const { BrandModel } = require('../models/Brand');

const getBrands = async (req, res, next) => {
    try {
        const brands = await BrandModel.find().sort({ order: 1, name: 1 });
        res.json({ success: true, brands });
    } catch (error) {
        next(error);
    }
};

const createBrand = async (req, res, next) => {
    try {
        const { name, logo, description, country, order } = req.body;
        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const brand = await BrandModel.create({ name, slug, logo, description, country, order });
        res.json({ success: true, brand });
    } catch (error) {
        next(error);
    }
};

const updateBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brand = await BrandModel.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, brand });
    } catch (error) {
        next(error);
    }
};

const deleteBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        await BrandModel.findByIdAndDelete(id);
        res.json({ success: true, message: 'Đã xóa thương hiệu' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
