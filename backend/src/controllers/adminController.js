/**
 * ============================================================
 * CONTROLLER: ADMIN (Quản trị chung)
 * Mô tả: Chứa các logic xử lý API dành riêng cho Dashboard Admin.
 * Bao gồm: Thống kê tổng quan (doanh thu, đơn hàng, người dùng),
 *           quản lý người dùng, quản lý đánh giá (reviews).
 * ============================================================
 */
const { ProductModel } = require('../models/Product');
const { OrderModel } = require('../models/Order');
const { UserModel } = require('../models/User');
const { ProductReviewModel } = require('../models/ProductReview');
const fs = require('fs');
const path = require('path');

/**
 * Hàm ghi log cục bộ ra file `backend_debug.log`
 * @param {string} msg - Nội dung thông báo
 */
function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [AdminController] ${msg}\n`);
    console.log(`[AdminController] ${msg}`);
}

/**
 * @desc    Lấy thống kê tổng quan cho Dashboard Admin
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getStats = async (req, res, next) => {
    try {
        const { timeframe = 'month' } = req.query;

        // Lấy toàn bộ sản phẩm và đơn hàng
        const products = await ProductModel.find();
        const orders = await OrderModel.find().sort({ createdAt: -1 });
        const users = await UserModel ? await UserModel.find() : [];

        // Thống kê trạng thái đơn hàng chi tiết
        const orderStatusCounts = {
            pending: orders.filter(o => o.status === 'pending').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            packing: orders.filter(o => o.status === 'packing' || o.status === 'processing').length,
            shipping: orders.filter(o => o.status === 'shipped' || o.status === 'shipping').length,
            delivered: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
            returned: orders.filter(o => o.status === 'returned' || o.status === 'return_requested').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
        };

        // Tính doanh thu theo thời gian
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const revenueToday = orders.filter(o => (o.status === 'delivered' || o.status === 'completed') && new Date(o.createdAt) >= startOfToday).reduce((s, o) => s + (o.totalAmount || 0), 0);
        const revenueWeek = orders.filter(o => (o.status === 'delivered' || o.status === 'completed') && new Date(o.createdAt) >= startOfWeek).reduce((s, o) => s + (o.totalAmount || 0), 0);
        const revenueMonth = orders.filter(o => (o.status === 'delivered' || o.status === 'completed') && new Date(o.createdAt) >= startOfMonth).reduce((s, o) => s + (o.totalAmount || 0), 0);
        const revenueYear = orders.filter(o => (o.status === 'delivered' || o.status === 'completed') && new Date(o.createdAt) >= startOfYear).reduce((s, o) => s + (o.totalAmount || 0), 0);

        const totalRevenue = orders
            .filter(o => o.status === 'delivered' || o.status === 'completed')
            .reduce((s, o) => s + (o.totalAmount || 0), 0);

        // Ước tính chi phí nhập hàng & lợi nhuận gộp (Giả định giá vốn chiếm ~60% giá bán)
        const estimatedCost = totalRevenue * 0.6;
        const grossProfit = totalRevenue - estimatedCost;

        // Đếm sản phẩm bán chạy & ít bán
        const productSalesCount = {};
        orders.forEach(order => {
            if (order.status !== 'cancelled') {
                (order.items || []).forEach(item => {
                    const pid = item.product?.id || item.productId;
                    if (pid) {
                        productSalesCount[pid] = (productSalesCount[pid] || 0) + item.quantity;
                    }
                });
            }
        });

        const topProducts = products
            .map(p => ({ ...p.toObject(), sales: productSalesCount[p.id] || 0 }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        const lowProducts = products
            .map(p => ({ ...p.toObject(), sales: productSalesCount[p.id] || 0 }))
            .sort((a, b) => a.sales - b.sales)
            .slice(0, 5);

        // Kho hàng
        const stockStatus = {
            inStock: products.filter(p => p.inStock && (p.stock === undefined || p.stock > 5)).length,
            lowStock: products.filter(p => p.inStock && p.stock !== undefined && p.stock > 0 && p.stock <= 5).length,
            outOfStock: products.filter(p => !p.inStock || p.stock === 0).length,
        };

        // Sparklines & Trends (10 ngày)
        const sparklines = { revenue: [], orders: [], products: [], customers: [] };
        const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        for (let i = 9; i >= 0; i--) {
            const dateStart = new Date(todayReset.getTime() - i * 24 * 60 * 60 * 1000);
            const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

            const dailyOrders = orders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= dateStart && d < dateEnd;
            });

            const dailyRevenue = dailyOrders
                .filter(o => o.status === 'delivered' || o.status === 'completed')
                .reduce((s, o) => s + (o.totalAmount || 0), 0);

            const dailyProducts = products.filter(p => {
                const d = new Date(p.createdAt || p.updatedAt);
                return d >= dateStart && d < dateEnd;
            }).length;

            const dailyCustomers = new Set(dailyOrders.map(o => o.email)).size;

            sparklines.revenue.push(dailyRevenue);
            sparklines.orders.push(dailyOrders.length);
            sparklines.products.push(dailyProducts);
            sparklines.customers.push(dailyCustomers);
        }

        const calcTrend = (arr) => {
            if (arr.length !== 10) return '+0%';
            const recent = arr.slice(5, 10).reduce((a, b) => a + b, 0);
            const previous = arr.slice(0, 5).reduce((a, b) => a + b, 0);
            if (previous === 0) return recent > 0 ? '+100%' : '0%';
            const diff = ((recent - previous) / previous) * 100;
            return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
        };

        const trends = {
            revenue: calcTrend(sparklines.revenue),
            orders: calcTrend(sparklines.orders),
            products: calcTrend(sparklines.products),
            customers: calcTrend(sparklines.customers)
        };

        res.json({
            success: true,
            stats: {
                totalRevenue,
                revenueToday,
                revenueWeek,
                revenueMonth,
                revenueYear,
                estimatedCost,
                grossProfit,
                orderCount: orders.length,
                orderStatusCounts,
                productCount: products.length,
                customerCount: new Set(orders.map(o => o.email)).size,
                recentOrders: orders.slice(0, 6),
                pendingOrders: orders.filter(o => !['delivered', 'completed', 'cancelled', 'returned', 'refunded'].includes(o.status)).slice(0, 10),
                topProducts,
                lowProducts,
                stockStatus,
                sparklines,
                trends
            }
        });
    } catch (error) {
        log('Lỗi API thống kê (/api/admin/stats): ' + error.message);
        next(error);
    }
};

/**
 * @desc    Lấy danh sách người dùng
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
    try {
        // Lấy danh sách, KHÔNG trả về trường password
        const users = await UserModel.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy danh sách tất cả đánh giá của khách hàng
 * @route   GET /api/admin/reviews
 * @access  Private/Admin
 */
const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await ProductReviewModel.find().sort({ createdAt: -1 });
        
        // Liên kết thủ công tên sản phẩm (do lược đồ ProductReview sử dụng trường String id thay vì ObjectId)
        const productIds = [...new Set(reviews.map(r => r.product_id))];
        const products = await ProductModel.find({ id: { $in: productIds } });
        
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
        }, {});

        // Gắn tên sản phẩm vào từng dòng đánh giá
        const reviewsWithProductName = reviews.map(r => ({
            ...r.toObject(),
            productName: productMap[r.product_id] || 'Sản phẩm không xác định'
        }));

        res.json({ success: true, reviews: reviewsWithProductName });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cập nhật trạng thái đánh giá (duyệt/từ chối/chờ duyệt)
 * @route   PUT /api/admin/reviews
 * @access  Private/Admin
 */
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
        
        /* --- Cập nhật lại điểm đánh giá trung bình của sản phẩm --- */
        // Chỉ lấy những đánh giá đã được duyệt ('approved')
        const allProductReviews = await ProductReviewModel.find({ product_id: review.product_id, status: 'approved' });
        
        const avgRating = allProductReviews.length > 0
            ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
            : 5; // Trở về mặc định là 5 sao nếu không còn đánh giá hợp lệ

        await ProductModel.findOneAndUpdate(
            { id: review.product_id },
            {
                rating: Math.round(avgRating * 10) / 10, // Làm tròn 1 chữ số thập phân (vd: 4.5)
                reviews: allProductReviews.length
            }
        );

        log(`Đã cập nhật trạng thái đánh giá ${id} thành ${status}`);
        res.json({ success: true, message: 'Cập nhật trạng thái thành công', review });
    } catch (error) {
        log(`Lỗi cập nhật trạng thái đánh giá: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Xóa một đánh giá
 * @route   DELETE /api/admin/reviews?id=...
 * @access  Private/Admin
 */
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

        /* --- Cập nhật lại điểm đánh giá trung bình của sản phẩm sau khi xóa --- */
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

        log(`Đã xóa đánh giá: ${id}`);
        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
        log(`Lỗi xóa đánh giá: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Phân quyền người dùng (User ↔ Admin)
 * @route   PUT /api/admin/users/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res, next) => {
    try {
        const { id, role } = req.body;
        
        if (!id || !['admin', 'user'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        const targetUser = await UserModel.findOne({ id });
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const SYSTEM_ADMINS = ['ntphau21@gmail.com', 'admin@havenstore.vn'];
        if (SYSTEM_ADMINS.includes(targetUser.email?.toLowerCase().trim()) && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Tài khoản Quản trị viên Mặc định Hệ thống không thể bị hạ quyền' });
        }

        targetUser.role = role;
        await targetUser.save();
        const userObj = targetUser.toObject();
        delete userObj.password;
        
        res.json({ success: true, message: 'Cập nhật quyền thành công', user: userObj });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa tài khoản người dùng
 * @route   DELETE /api/admin/users?id=...
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
        }
        
        const targetUser = await UserModel.findOne({ id });
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const SYSTEM_ADMINS = ['ntphau21@gmail.com', 'admin@havenstore.vn'];
        if (SYSTEM_ADMINS.includes(targetUser.email?.toLowerCase().trim())) {
            return res.status(400).json({ success: false, message: 'Tài khoản Quản trị viên Mặc định Hệ thống không thể bị xóa' });
        }

        await UserModel.findOneAndDelete({ id });
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
