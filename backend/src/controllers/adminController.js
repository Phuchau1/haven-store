const { ProductModel } = require('../models/Product');
const { OrderModel } = require('../models/Order');
const { UserModel } = require('../models/User');
const { ProductReviewModel } = require('../models/ProductReview');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [AdminController] ${msg}\n`);
    console.log(`[AdminController] ${msg}`);
}

const getStats = async (req, res, next) => {
    try {
        const products = await ProductModel.find();
        const orders = await OrderModel.find().sort({ createdAt: -1 });

        // Tính tổng doanh thu từ các đơn hàng 'delivered'
        const revenue = orders
            .filter(o => o.status === 'delivered')
            .reduce((s, o) => s + (o.totalAmount || 0), 0);

        // Tính sản phẩm bán chạy nhất
        const productSalesCount = {};
        orders.forEach(order => {
            if (order.status !== 'cancelled') {
                order.items.forEach(item => {
                    const pid = item.product.id;
                    productSalesCount[pid] = (productSalesCount[pid] || 0) + item.quantity;
                });
            }
        });

        const topProducts = products
            .map(p => {
                const pObj = p.toObject();
                return {
                    ...pObj,
                    sales: productSalesCount[p.id] || 0
                };
            })
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        // Thống kê kho hàng
        const stockStatus = {
            inStock: products.filter(p => p.inStock).length,
            outOfStock: products.filter(p => !p.inStock).length,
        };

        res.json({
            success: true,
            stats: {
                totalRevenue: revenue,
                orderCount: orders.length,
                productCount: products.length,
                customerCount: new Set(orders.map(o => o.email)).size,
                recentOrders: orders.slice(0, 5),
                topProducts: topProducts,
                stockStatus: stockStatus
            }
        });
    } catch (error) {
        log('Error in /api/admin/stats: ' + error.message);
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await UserModel.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        next(error);
    }
};

const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await ProductReviewModel.find().sort({ createdAt: -1 });
        
        // Populate product names locally since there's no native ref in Schema definition
        const productIds = [...new Set(reviews.map(r => r.product_id))];
        const products = await ProductModel.find({ id: { $in: productIds } });
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
        }, {});

        const reviewsWithProductName = reviews.map(r => ({
            ...r.toObject(),
            productName: productMap[r.product_id] || 'Sản phẩm không xác định'
        }));

        res.json({ success: true, reviews: reviewsWithProductName });
    } catch (error) {
        next(error);
    }
};

const updateReviewStatus = async (req, res, next) => {
    try {
        const { id, status } = req.body;
        if (!id || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        const review = await ProductReviewModel.findOneAndUpdate({ id }, { status }, { new: true });
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }
        
        // Update product rating summary
        const allProductReviews = await ProductReviewModel.find({ product_id: review.product_id, status: 'approved' });
        const avgRating = allProductReviews.length > 0
            ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
            : 5;

        await ProductModel.findOneAndUpdate(
            { id: review.product_id },
            {
                rating: Math.round(avgRating * 10) / 10,
                reviews: allProductReviews.length
            }
        );

        log(`Updated review status: ${id} to ${status}`);
        res.json({ success: true, message: 'Cập nhật trạng thái thành công', review });
    } catch (error) {
        log(`Error updating review status: ${error.message}`);
        next(error);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID đánh giá' });
        }

        const deletedReview = await ProductReviewModel.findOneAndDelete({ id });
        if (!deletedReview) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }

        // Update product rating summary
        const allProductReviews = await ProductReviewModel.find({ product_id: deletedReview.product_id, status: 'approved' });
        const avgRating = allProductReviews.length > 0
            ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
            : 5;

        await ProductModel.findOneAndUpdate(
            { id: deletedReview.product_id },
            {
                rating: Math.round(avgRating * 10) / 10,
                reviews: allProductReviews.length
            }
        );

        log(`Deleted review: ${id}`);
        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
        log(`Error deleting review: ${error.message}`);
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { id, role } = req.body;
        if (!id || !['admin', 'user'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }
        const user = await UserModel.findOneAndUpdate({ id }, { role }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.json({ success: true, message: 'Cập nhật quyền thành công', user });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
        }
        const user = await UserModel.findOneAndDelete({ id });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        res.json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getUsers,
    getAllReviews,
    updateReviewStatus,
    deleteReview,
    updateUserRole,
    deleteUser
};
