const { CategoryModel } = require('../models/Category');
const { ProductModel } = require('../models/Product');

// ─── GET ALL CATEGORIES (public) ──────────────────────────────────────────────
const getCategories = async (req, res, next) => {
    try {


        const filter = {};
        if (req.query.active === 'true') filter.isActive = true;

        const categories = await CategoryModel
            .find(filter)
            .sort({ order: 1, createdAt: 1 })
            .lean();

        for (let cat of categories) {
            cat.count = await ProductModel.countDocuments({
                $or: [{ category_id: cat.id }, { category: cat.id }]
            });
        }

        res.json({ success: true, categories });
    } catch (error) {
        next(error);
    }
};

// ─── GET SINGLE CATEGORY ──────────────────────────────────────────────────────
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findOne({ id });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.json({ success: true, category });
    } catch (error) {
        next(error);
    }
};

// ─── CREATE CATEGORY ─────────────────────────────────────────────────────────
const createCategory = async (req, res, next) => {
    try {
        const { id, name, description, image, video, order, isActive, subcategories } = req.body;

        if (!id || !name || !image) {
            return res.status(400).json({ success: false, message: 'Thiếu ID, tên hoặc ảnh danh mục' });
        }

        const exists = await CategoryModel.findOne({ id });
        if (exists) {
            return res.status(400).json({ success: false, message: 'ID danh mục đã tồn tại' });
        }

        const newCategory = new CategoryModel({
            id,
            name,
            description: description || '',
            image,
            video: video || '',
            count: 0,
            order: order ?? 0,
            isActive: isActive !== false,
            subcategories: subcategories || [],
        });

        await newCategory.save();
        res.json({ success: true, message: 'Thêm danh mục thành công', category: newCategory });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE CATEGORY ──────────────────────────────────────────────────────────
const updateCategory = async (req, res, next) => {
    try {
        const { id, name, description, image, video, order, isActive, subcategories } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID danh mục' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (video !== undefined) updateData.video = video;
        if (order !== undefined) updateData.order = order;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (subcategories !== undefined) updateData.subcategories = subcategories;

        const category = await CategoryModel.findOneAndUpdate(
            { id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.json({ success: true, message: 'Cập nhật danh mục thành công', category });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE CATEGORY ──────────────────────────────────────────────────────────
const deleteCategory = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID danh mục' });
        }

        const deleted = await CategoryModel.findOneAndDelete({ id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
        next(error);
    }
};

// ─── ADD SUBCATEGORY ──────────────────────────────────────────────────────────
const addSubcategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const { id, name, description, image, order } = req.body;

        if (!id || !name) {
            return res.status(400).json({ success: false, message: 'Thiếu ID hoặc tên danh mục con' });
        }

        const category = await CategoryModel.findOne({ id: categoryId });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục cha' });
        }

        // Check duplicate sub id within category
        const subExists = category.subcategories.find(s => s.id === id);
        if (subExists) {
            return res.status(400).json({ success: false, message: 'ID danh mục con đã tồn tại' });
        }

        category.subcategories.push({
            id,
            name,
            description: description || '',
            image: image || '',
            order: order ?? 0,
            isActive: true,
        });

        await category.save();
        res.json({ success: true, message: 'Thêm danh mục con thành công', category });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE SUBCATEGORY ───────────────────────────────────────────────────────
const updateSubcategory = async (req, res, next) => {
    try {
        const { categoryId, subId } = req.params;
        const { name, description, image, order, isActive } = req.body;

        const category = await CategoryModel.findOne({ id: categoryId });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục cha' });
        }

        const sub = category.subcategories.find(s => s.id === subId);
        if (!sub) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục con' });
        }

        if (name !== undefined) sub.name = name;
        if (description !== undefined) sub.description = description;
        if (image !== undefined) sub.image = image;
        if (order !== undefined) sub.order = order;
        if (isActive !== undefined) sub.isActive = isActive;

        await category.save();
        res.json({ success: true, message: 'Cập nhật danh mục con thành công', category });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE SUBCATEGORY ───────────────────────────────────────────────────────
const deleteSubcategory = async (req, res, next) => {
    try {
        const { categoryId, subId } = req.params;

        const category = await CategoryModel.findOne({ id: categoryId });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục cha' });
        }

        const beforeLen = category.subcategories.length;
        category.subcategories = category.subcategories.filter(s => s.id !== subId);

        if (category.subcategories.length === beforeLen) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục con' });
        }

        await category.save();
        res.json({ success: true, message: 'Xóa danh mục con thành công', category });
    } catch (error) {
        next(error);
    }
};

// ─── REORDER CATEGORIES ───────────────────────────────────────────────────────
const reorderCategories = async (req, res, next) => {
    try {
        const { orders } = req.body; // [{ id, order }]
        if (!Array.isArray(orders)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        const ops = orders.map(({ id, order }) => ({
            updateOne: {
                filter: { id },
                update: { $set: { order } },
            }
        }));

        await CategoryModel.bulkWrite(ops);
        res.json({ success: true, message: 'Cập nhật thứ tự thành công' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    reorderCategories,
};
