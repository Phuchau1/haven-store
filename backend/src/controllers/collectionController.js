const { CollectionModel } = require('../models/Collection');

const getCollections = async (req, res, next) => {
    try {
        const collections = await CollectionModel.find().sort({ createdAt: -1 });
        res.json({ success: true, collections });
    } catch (error) {
        next(error);
    }
};

const createCollection = async (req, res, next) => {
    try {
        const { name, banner, description, productIds, isFeatured, startDate, endDate } = req.body;
        const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const collection = await CollectionModel.create({ name, slug, banner, description, productIds, isFeatured, startDate, endDate });
        res.json({ success: true, collection });
    } catch (error) {
        next(error);
    }
};

const updateCollection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const collection = await CollectionModel.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, collection });
    } catch (error) {
        next(error);
    }
};

const deleteCollection = async (req, res, next) => {
    try {
        const { id } = req.params;
        await CollectionModel.findByIdAndDelete(id);
        res.json({ success: true, message: 'Đã xóa bộ sưu tập' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCollections, createCollection, updateCollection, deleteCollection };
