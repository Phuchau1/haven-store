/**
 * ============================================================
 * CONTROLLER: DANH MỤC SẢN PHẨM (Category)
 * Mô tả: Xử lý quản lý Danh mục chính và Danh mục con (Subcategory).
 *        Hỗ trợ Redis Cache để tăng tốc API lấy danh sách.
 * ============================================================
 */
const { CategoryModel } = require('../models/Category');
const { ProductModel } = require('../models/Product');
const { getCache, setCache, delCache } = require('../utils/redisClient');

/**
 * @desc Lấy danh sách tất cả các danh mục (hỗ trợ Redis Cache)
 */
const getCategories = async (req, res, next) => {
    try {
        const cacheKey = 'categories:' + (req.query.active === 'true' ? 'active' : 'all');
        const cachedCategories = await getCache(cacheKey);
        
        if (cachedCategories) {
            return res.json({ success: true, categories: cachedCategories, cached: true });
        }

        const filter = {};
        if (req.query.active === 'true') filter.isActive = true;

        const categories = await CategoryModel
            .find(filter)
            .sort({ order: 1, createdAt: 1 })
            .lean();

        // Đếm số lượng sản phẩm thuộc mỗi danh mục
        for (let cat of categories) {
            cat.count = await ProductModel.countDocuments({
                $or: [{ category_id: cat.id }, { category: cat.id }]
            });
        }

        // Lưu vào Cache trong 1 giờ
        await setCache(cacheKey, categories, 3600); 

        res.json({ success: true, categories });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Lấy chi tiết một danh mục theo ID
 */
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

/**
 * @desc Tạo danh mục chính mới
 */
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
        await delCache('categories:*', true); // Xóa cache
        res.json({ success: true, message: 'Thêm danh mục thành công', category: newCategory });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Cập nhật thông tin danh mục chính
 */
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

        await delCache('categories:*', true); // Xóa cache
        res.json({ success: true, message: 'Cập nhật danh mục thành công', category });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Xóa danh mục chính
 */
const deleteCategory = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID danh mục' });
        }

        const deleted = await CategoryModel.findOneAndDelete({ id });
        await delCache('categories:*', true); // Xóa cache
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
        next(error);
    }
};

/* ============================================================
 * XỬ LÝ DANH MỤC CON (SUBCATEGORY) NẰM TRONG DANH MỤC CHÍNH
 * ============================================================ */

/**
 * @desc Thêm một danh mục con vào danh mục chính
 */
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

        // Kiểm tra xem ID danh mục con đã tồn tại trong mảng chưa
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
        await delCache('categories:*', true);
        res.json({ success: true, message: 'Thêm danh mục con thành công', category });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Cập nhật thông tin một danh mục con
 */
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
        await delCache('categories:*', true);
        res.json({ success: true, message: 'Cập nhật danh mục con thành công', category });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Xóa một danh mục con khỏi danh mục chính
 */
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
        await delCache('categories:*', true);
        res.json({ success: true, message: 'Xóa danh mục con thành công', category });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Cập nhật lại thứ tự hiển thị của nhiều danh mục cùng lúc (Kéo thả kéo)
 */
const reorderCategories = async (req, res, next) => {
    try {
        const { orders } = req.body; // Mảng: [{ id, order }]
        if (!Array.isArray(orders)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        // Chạy BulkWrite để update nhiều document cùng lúc cho tối ưu
        const ops = orders.map(({ id, order }) => ({
            updateOne: {
                filter: { id },
                update: { $set: { order } },
            }
        }));

        await CategoryModel.bulkWrite(ops);
        await delCache('categories:*', true);
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
