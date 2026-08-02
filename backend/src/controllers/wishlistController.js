/**
 * ============================================================
 * CONTROLLER: WISHLIST (SẢN PHẨM YÊU THÍCH)
 * Mô tả: Xử lý các logic thêm, xóa, xem danh sách yêu thích
 *        và cung cấp APIs Thống kê/Quản lý chuyên sâu cho Admin.
 * ============================================================
 */
const { WishlistModel } = require('../models/Wishlist');
const { ProductModel } = require('../models/Product');
const { CategoryModel } = require('../models/Category');
const { UserModel } = require('../models/User');
const { OrderModel } = require('../models/Order');

/**
 * @desc    Lấy danh sách sản phẩm yêu thích của User (Client)
 * @route   GET /api/wishlist
 * @access  Private
 */
const getWishlist = async (req, res, next) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        const wishlistItems = await WishlistModel.find({ user_id }).sort({ created_at: -1 });
        const productIds = wishlistItems.map(item => item.product_id);
        const products = await ProductModel.find({ id: { $in: productIds } });
        
        const orderedProducts = [];
        wishlistItems.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                const productObj = product.toObject();
                productObj.wishlist_added_at = item.created_at;
                orderedProducts.push(productObj);
            }
        });

        res.json({ success: true, wishlist: orderedProducts });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Thêm 1 sản phẩm vào danh sách yêu thích (Client)
 * @route   POST /api/wishlist
 * @access  Private
 */
const addWishlist = async (req, res, next) => {
    try {
        const { user_id, product_id } = req.body;
        
        if (!user_id || !product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const productExists = await ProductModel.exists({ id: product_id });
        if (!productExists) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        const existingItem = await WishlistModel.findOne({ user_id, product_id });
        if (existingItem) {
            return res.status(400).json({ success: false, message: 'Sản phẩm này đã có trong danh sách yêu thích' });
        }

        const id = `wl-${Math.random().toString(36).substr(2, 9)}`;
        const newWishlist = new WishlistModel({
            id,
            user_id,
            product_id,
            created_at: new Date().toISOString()
        });

        await newWishlist.save();
        res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích', item: newWishlist });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa 1 sản phẩm khỏi danh sách yêu thích (Client)
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
const removeWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        const deleted = await WishlistModel.findOneAndDelete({ user_id, product_id: productId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không nằm trong danh sách yêu thích' });
        }

        res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa TOÀN BỘ danh sách yêu thích của User (Client)
 * @route   DELETE /api/wishlist/clear
 * @access  Private
 */
const clearWishlist = async (req, res, next) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Thiếu user_id' });
        }

        await WishlistModel.deleteMany({ user_id });

        res.json({ success: true, message: 'Đã xóa toàn bộ danh sách yêu thích' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy dữ liệu Thống kê Dashboard Wishlist cho Admin (Có conversion rate, chart theo ngày, top danh mục)
 * @route   GET /api/wishlist/admin-stats
 * @access  Private/Admin
 */
const getWishlistAdminStats = async (req, res, next) => {
    try {
        // 1. Overview Stats
        const totalFavorites = await WishlistModel.countDocuments();
        const uniqueUsers = await WishlistModel.distinct('user_id');
        const totalUsers = uniqueUsers.length;

        // 2. Top 10 sản phẩm được yêu thích nhất
        const topProductsAggr = await WishlistModel.aggregate([
            { $group: { _id: '$product_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topProductIds = topProductsAggr.map(item => item._id);
        const topProductsData = await ProductModel.find({ id: { $in: topProductIds } });

        const topProducts = topProductsAggr.map(item => {
            const product = topProductsData.find(p => p.id === item._id);
            return {
                id: item._id,
                name: product ? product.name : 'Sản phẩm đã bị xóa',
                image: product && product.images.length > 0 ? product.images[0] : null,
                price: product ? product.price : 0,
                inStock: product ? product.inStock : false,
                soldQuantity: product ? product.soldQuantity : 0,
                favorites_count: item.count
            };
        });

        // 3. Top khách hàng thả tim nhiều nhất
        const topCustomersAggr = await WishlistModel.aggregate([
            { $group: { _id: '$user_id', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const topUserIds = topCustomersAggr.map(item => item._id);
        const usersData = await UserModel.find({ id: { $in: topUserIds } }).select('id name email avatar phone');
        const topCustomers = topCustomersAggr.map(item => {
            const u = usersData.find(user => user.id === item._id);
            return {
                userId: item._id,
                name: u ? u.name : 'Khách vãng lai',
                email: u ? u.email : '',
                avatar: u ? u.avatar : '',
                favoritesCount: item.count
            };
        });

        // 4. Thống kê theo Danh mục (Top 10 categories)
        const allWishlists = await WishlistModel.find().select('product_id');
        const allProductIdsInWishlist = allWishlists.map(w => w.product_id);
        const productsForCategories = await ProductModel.find({ id: { $in: allProductIdsInWishlist } }).select('id categoryId');
        
        // Map product_id -> categoryId
        const prodCatMap = {};
        productsForCategories.forEach(p => {
            prodCatMap[p.id] = p.categoryId || 'uncategorized';
        });

        const categoryCounts = {};
        allWishlists.forEach(w => {
            const catId = prodCatMap[w.product_id] || 'uncategorized';
            categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
        });

        const categoriesList = await CategoryModel.find().select('id name');
        const catNameMap = {};
        categoriesList.forEach(c => { catNameMap[c.id] = c.name; });

        const topCategories = Object.keys(categoryCounts)
            .map(catId => ({
                id: catId,
                name: catNameMap[catId] || (catId === 'uncategorized' ? 'Chưa phân loại' : catId),
                count: categoryCounts[catId]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 5. Tính Tỷ lệ chuyển đổi Yêu thích -> Đã mua (Conversion Rate)
        // Tìm xem trong số các cặp (user_id, product_id) thuộc Wishlist, có bao nhiêu sản phẩm user đã thực sự mua
        let totalConverted = 0;
        if (allWishlists.length > 0) {
            const userOrders = await OrderModel.find({ 
                orderStatus: { $nin: ['Cancelled', 'Returned'] } 
            }).select('user_id items');

            const purchasedUserProductsSet = new Set();
            userOrders.forEach(o => {
                if (o.user_id && o.items) {
                    o.items.forEach(it => {
                        if (it.product_id) {
                            purchasedUserProductsSet.add(`${o.user_id}_${it.product_id}`);
                        }
                    });
                }
            });

            allWishlists.forEach(w => {
                if (purchasedUserProductsSet.has(`${w.user_id}_${w.product_id}`)) {
                    totalConverted++;
                }
            });
        }
        const conversionRate = totalFavorites > 0 ? ((totalConverted / totalFavorites) * 100).toFixed(1) : 0;

        // 6. Biểu đồ lượt yêu thích 7 ngày gần nhất
        const now = new Date();
        const dailyStats = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            // Count created_at matching dateStr
            const count = allWishlists.filter(w => w.createdAt && new Date(w.createdAt).toISOString().split('T')[0] === dateStr).length;
            
            dailyStats.push({
                date: `${d.getDate()}/${d.getMonth() + 1}`,
                fullDate: dateStr,
                count
            });
        }

        res.json({
            success: true,
            stats: {
                totalFavorites,
                totalUsers,
                totalConverted,
                conversionRate: Number(conversionRate),
                topProducts,
                topCustomers,
                topCategories,
                dailyStats
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy danh sách sản phẩm yêu thích (dành cho Tab Theo Sản Phẩm)
 *          Có bộ lọc: Category, Thời gian (7d, 30d, 90d, all), Sắp xếp
 * @route   GET /api/wishlist/admin-products
 * @access  Private/Admin
 */
const getWishlistProductsAdmin = async (req, res, next) => {
    try {
        const { category_id, range, sort_by } = req.query; // sort_by: favorites_desc, favorites_asc, price_desc, price_asc, sold_desc

        // Tính khoảng thời gian lọc
        let queryFilter = {};
        if (range && range !== 'all') {
            const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
            const days = daysMap[range] || 30;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - days);
            queryFilter.createdAt = { $gte: pastDate };
        }

        // Aggregate Wishlist
        const wishlistAggr = await WishlistModel.aggregate([
            ...(Object.keys(queryFilter).length > 0 ? [{ $match: queryFilter }] : []),
            { $group: { _id: '$product_id', count: { $sum: 1 } } }
        ]);

        const favCountMap = {};
        wishlistAggr.forEach(item => { favCountMap[item._id] = item.count; });

        // Build product query
        let productFilter = {};
        if (category_id && category_id !== 'all') {
            productFilter.categoryId = category_id;
        }

        let products = await ProductModel.find(productFilter);

        // Transform list
        let result = products.map(p => {
            return {
                id: p.id,
                name: p.name,
                image: p.images && p.images.length > 0 ? p.images[0] : null,
                price: p.price,
                originalPrice: p.originalPrice || p.price,
                categoryId: p.categoryId,
                inStock: p.inStock,
                stockQuantity: p.stockQuantity || 0,
                soldQuantity: p.soldQuantity || 0,
                favoritesCount: favCountMap[p.id] || 0
            };
        });

        // Chỉ lấy những sản phẩm có lượt yêu thích > 0 nếu có filter range
        if (range && range !== 'all') {
            result = result.filter(item => item.favoritesCount > 0);
        }

        // Sắp xếp
        if (sort_by === 'favorites_asc') {
            result.sort((a, b) => a.favoritesCount - b.favoritesCount);
        } else if (sort_by === 'price_desc') {
            result.sort((a, b) => b.price - a.price);
        } else if (sort_by === 'price_asc') {
            result.sort((a, b) => a.price - b.price);
        } else if (sort_by === 'sold_desc') {
            result.sort((a, b) => b.soldQuantity - a.soldQuantity);
        } else {
            // Default: favorites_desc
            result.sort((a, b) => b.favoritesCount - a.favoritesCount);
        }

        res.json({ success: true, products: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xem chi tiết 1 sản phẩm: Danh sách các Khách hàng đã thả tim sản phẩm này
 * @route   GET /api/wishlist/admin-products/:productId/users
 * @access  Private/Admin
 */
const getWishlistProductUsersAdmin = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const product = await ProductModel.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        const wishlistRecords = await WishlistModel.find({ product_id: productId }).sort({ createdAt: -1 });
        const userIds = wishlistRecords.map(w => w.user_id);
        const usersData = await UserModel.find({ id: { $in: userIds } }).select('id name email phone avatar');

        const usersList = wishlistRecords.map(w => {
            const u = usersData.find(user => user.id === w.user_id);
            return {
                userId: w.user_id,
                name: u ? u.name : 'Khách vãng lai',
                email: u ? u.email : '—',
                phone: u ? u.phone : '—',
                avatar: u ? u.avatar : '',
                favoritedAt: w.created_at || w.createdAt
            };
        });

        res.json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                price: product.price,
                favoritesCount: wishlistRecords.length
            },
            users: usersList
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy danh sách Khách hàng thả tim sản phẩm (dành cho Tab Theo Khách Hàng)
 * @route   GET /api/wishlist/admin-customers
 * @access  Private/Admin
 */
const getWishlistCustomersAdmin = async (req, res, next) => {
    try {
        const { search } = req.query; // Tìm theo Tên, Email, SĐT

        const customerAggr = await WishlistModel.aggregate([
            { $group: { _id: '$user_id', favoritesCount: { $sum: 1 }, lastAddedAt: { $max: '$createdAt' } } },
            { $sort: { favoritesCount: -1 } }
        ]);

        const userIds = customerAggr.map(c => c._id);
        let userQuery = { id: { $in: userIds } };

        if (search) {
            userQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const usersData = await UserModel.find(userQuery).select('id name email phone avatar');

        const customers = [];
        customerAggr.forEach(c => {
            const u = usersData.find(user => user.id === c._id);
            if (u || !search) { // Nếu tìm kiếm thì chỉ lấy những người khớp userQuery
                customers.push({
                    userId: c._id,
                    name: u ? u.name : 'Khách vãng lai',
                    email: u ? u.email : '—',
                    phone: u ? u.phone : '—',
                    avatar: u ? u.avatar : '',
                    favoritesCount: c.favoritesCount,
                    lastAddedAt: c.lastAddedAt
                });
            }
        });

        res.json({ success: true, customers });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xem chi tiết 1 Khách hàng: Danh sách các Sản phẩm mà khách hàng này đã thả tim
 * @route   GET /api/wishlist/admin-customers/:userId
 * @access  Private/Admin
 */
const getWishlistCustomerDetailAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await UserModel.findOne({ id: userId }).select('id name email phone avatar');
        
        const wishlistRecords = await WishlistModel.find({ user_id: userId }).sort({ createdAt: -1 });
        const productIds = wishlistRecords.map(w => w.product_id);
        const products = await ProductModel.find({ id: { $in: productIds } });

        const productsList = wishlistRecords.map(w => {
            const p = products.find(prod => prod.id === w.product_id);
            return {
                id: w.product_id,
                name: p ? p.name : 'Sản phẩm đã bị xóa',
                image: p && p.images && p.images.length > 0 ? p.images[0] : null,
                price: p ? p.price : 0,
                inStock: p ? p.inStock : false,
                soldQuantity: p ? p.soldQuantity : 0,
                favoritedAt: w.created_at || w.createdAt
            };
        });

        res.json({
            success: true,
            customer: {
                userId,
                name: user ? user.name : 'Khách vãng lai',
                email: user ? user.email : '—',
                phone: user ? user.phone : '—',
                avatar: user ? user.avatar : '',
                favoritesCount: wishlistRecords.length
            },
            products: productsList
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWishlist,
    addWishlist,
    removeWishlist,
    clearWishlist,
    getWishlistAdminStats,
    getWishlistProductsAdmin,
    getWishlistProductUsersAdmin,
    getWishlistCustomersAdmin,
    getWishlistCustomerDetailAdmin
};
