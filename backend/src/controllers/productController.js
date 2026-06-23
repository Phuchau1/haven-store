const { ProductModel } = require('../models/Product');
const { getCache, setCache, delCache } = require('../utils/redisClient');
const { ProductReviewModel } = require('../models/ProductReview');

const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [ProductController] ${msg}\n`);
    console.log(`[ProductController] ${msg}`);
}

const getProducts = async (req, res, next) => {
    try {
        const cacheKey = 'products:' + Buffer.from(JSON.stringify(req.query)).toString('base64');
        const cachedProducts = await getCache(cacheKey);
        if (cachedProducts) {
            return res.json({ success: true, products: cachedProducts, cached: true });
        }

        const { category, subCategory, search, sort, discounted, discount, limit } = req.query;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;

        let query = {};
        const andConditions = [];

        if (category) {
            if (category.startsWith('cat-')) {
                andConditions.push({ $or: [{ category_id: category }, { category: category }] });
            } else {
                query.category = category;
            }
        }

        if (subCategory) {
            query.subCategory = subCategory;
        }

        if (discounted === 'true' && !discount) {
            query.$expr = { $gt: ["$originalPrice", "$price"] };
        }

        if (discount) {
            const discPercent = parseInt(discount, 10);
            if (!isNaN(discPercent)) {
                const minFraction = discPercent / 100;
                query.$expr = {
                    $and: [
                        { $gt: ["$originalPrice", 0] },
                        { $gt: ["$originalPrice", "$price"] },
                        { $gte: [{ $divide: [{ $subtract: ["$originalPrice", "$price"] }, "$originalPrice"] }, minFraction] }
                    ]
                };
            }
        }

        if (search) {
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { subCategory: { $regex: search, $options: 'i' } },
                    { subCategoryLabel: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        let sortOption = { createdAt: -1, _id: -1 };
        if (sort === 'price-asc') {
            sortOption = { price: 1, _id: -1 };
        } else if (sort === 'price-desc') {
            sortOption = { price: -1, _id: -1 };
        } else if (sort === 'popular') {
            sortOption = { rating: -1, _id: -1 };
        } else if (sort === 'best-selling') {
            sortOption = { soldQuantity: -1, _id: -1 };
        }

        const productsQuery = ProductModel.find(query).sort(sortOption);
        if (Number.isFinite(limitNumber)) {
            productsQuery.limit(limitNumber);
        }

        const products = await productsQuery;
        
        await setCache(cacheKey, products, 300); // cache for 5 minutes
        
        res.json({ success: true, products });
    } catch (error) {
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const newProductData = req.body;
        
        // Nếu không có ID sản phẩm, tự tạo ID
        if (!newProductData.id) {
            newProductData.id = `sp-${Math.random().toString(36).substr(2, 9)}`;
        }

        const newProduct = new ProductModel(newProductData);
        await newProduct.save();
        await delCache('products:*', true);
        log(`Added product: ${newProduct.id}`);
        res.json({ success: true, message: 'Thêm sản phẩm thành công', product: newProduct });
    } catch (error) {
        log(`Error adding product: ${error.message}`);
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id, ...data } = req.body;
        const updatedProduct = await ProductModel.findOneAndUpdate({ id }, data, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        log(`Updated product: ${id}`);
        res.json({ success: true, message: 'Cập nhật thành công', product: updatedProduct });
    } catch (error) {
        log(`Error updating product: ${error.message}`);
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }
        const deletedProduct = await ProductModel.findOneAndDelete({ id });
        await delCache('products:*', true);
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        log(`Deleted product: ${id}`);
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        log(`Error deleting product: ${error.message}`);
        next(error);
    }
};

const getProductReviews = async (req, res, next) => {
    try {
        const { product_id } = req.query;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }
        const reviews = await ProductReviewModel.find({ product_id, status: 'approved' }).sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};

const createProductReview = async (req, res, next) => {
    try {
        const { product_id, rating, content, userName, userEmail, user_id } = req.body;
        if (!product_id || !rating || !content) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá bắt buộc' });
        }

        const reviewId = `rv-${Math.random().toString(36).substr(2, 9)}`;
        const newReview = new ProductReviewModel({
            id: reviewId,
            user_id: user_id || 'guest',
            userName: userName || 'Khách hàng',
            userEmail: userEmail || '',
            product_id,
            rating: Number(rating),
            content,
            status: 'approved'
        });

        await newReview.save();
        log(`Created review: ${reviewId} for product: ${product_id}`);

        // Cập nhật điểm đánh giá trung bình & số lượt đánh giá của sản phẩm
        const allProductReviews = await ProductReviewModel.find({ product_id, status: 'approved' });
        const avgRating = allProductReviews.length > 0
            ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
            : 5;

        await ProductModel.findOneAndUpdate(
            { id: product_id },
            {
                rating: Math.round(avgRating * 10) / 10,
                reviews: allProductReviews.length
            }
        );

        res.json({ success: true, message: 'Gửi đánh giá thành công', review: newReview });
    } catch (error) {
        log(`Error creating review: ${error.message}`);
        next(error);
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductReviews,
    createProductReview
};
