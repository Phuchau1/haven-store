/**
 * ============================================================
 * CONTROLLER: SẢN PHẨM (Product)
 * Mô tả: Xử lý các logic liên quan đến danh sách sản phẩm,
 *        chi tiết sản phẩm, lọc, tìm kiếm, đánh giá và Redis Cache.
 * ============================================================
 */
const { ProductModel } = require('../models/Product');
const { getCache, setCache, delCache } = require('../utils/redisClient');
const { invalidateCache } = require('../middleware/cacheMiddleware');
const { ProductReviewModel } = require('../models/ProductReview');
const { ProductVariantModel } = require('../models/ProductVariant');
const { OrderModel } = require('../models/Order');

const fs = require('fs');
const path = require('path');

/**
 * Hàm ghi log cục bộ ra file `backend_debug.log`
 */
function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [ProductController] ${msg}\n`);
    console.log(`[ProductController] ${msg}`);
}

/**
 * @desc    Lấy danh sách sản phẩm (có hỗ trợ cache Redis)
 * @route   GET /api/products
 * @access  Public
 * @query   category, subCategory, search, sort, discounted, discount, limit
 */
const getProducts = async (req, res, next) => {
    try {
        // --- 1. Tạo Key Cache dựa trên tham số query ---
        // Base64 chuỗi JSON của req.query để tạo chuỗi unique làm key cho Redis
        const cacheKey = 'products:' + Buffer.from(JSON.stringify(req.query)).toString('base64');
        
        // --- 2. Kiểm tra Cache ---
        const cachedProducts = await getCache(cacheKey);
        if (cachedProducts) {
            // Nếu có dữ liệu trong cache, trả về ngay (tiết kiệm thời gian truy vấn DB)
            return res.json({ success: true, products: cachedProducts, cached: true });
        }

        const { category, subCategory, search, sort, discounted, discount, limit, admin, includeHidden } = req.query;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;

        let query = {};
        const andConditions = [];

        // Nếu không phải Admin hoặc không yêu cầu includeHidden -> Lọc bỏ sản phẩm bị ẩn (draft / inStock == false)
        if (admin !== 'true' && includeHidden !== 'true') {
            andConditions.push({
                status: { $ne: 'draft' },
                inStock: { $ne: false }
            });
        }

        // --- 3. Xây dựng điều kiện lọc (Filters) ---

        // Lọc theo Danh mục (Category)
        if (category) {
            if (category.startsWith('cat-')) {
                andConditions.push({ $or: [{ category_id: category }, { category: category }] });
            } else {
                query.category = category;
            }
        }

        // Lọc theo Danh mục con (Hỗ trợ nhóm cha như ao-nam, quan-nam, ao-nu, quan-nu, v.v.)
        if (subCategory) {
            const groupMappings = {
                'ao-nam': ['ao-so-mi-nam', 'ao-polo-nam', 'ao-thun-nam', 'ao-khoac-nam'],
                'quan-nam': ['quan-au-nam', 'quan-jean-nam', 'quan-kaki-nam', 'quan-short-nam'],
                'bo-do-nam': ['bo-vest-nam'],
                'phu-kien-nam': ['giay-da-nam', 'vi-da-nam', 'day-lung-nam', 'dep-nam'],
                'ao-nu': ['ao-so-mi-nu', 'ao-polo-nu', 'ao-thun-nu', 'ao-khoac-nu'],
                'quan-nu': ['quan-au-nu', 'quan-jean-nu', 'quan-short-nu'],
                'vay-dam': ['vay-lien-dam', 'chan-vay'],
                'phu-kien-nu': ['giay-dep-nu', 'tui-xach']
            };

            if (groupMappings[subCategory]) {
                andConditions.push({ subCategory: { $in: groupMappings[subCategory] } });
            } else {
                andConditions.push({ subCategory: subCategory });
            }
        }

        // Lọc các sản phẩm Đang giảm giá (bất kỳ mức nào)
        if ((discounted === 'true' || discount === 'true')) {
            // Lấy sản phẩm có Giá gốc > Giá bán
            query.$expr = { $gt: ["$originalPrice", "$price"] };
        } else if (discount) {
            // Lọc sản phẩm theo % giảm giá tối thiểu
            const discPercent = parseInt(discount, 10);
            if (!isNaN(discPercent)) {
                const minFraction = discPercent / 100; // vd: 20% -> 0.2
                query.$expr = {
                    $and: [
                        { $gt: ["$originalPrice", 0] },          // Giá gốc phải > 0
                        { $gt: ["$originalPrice", "$price"] },   // Có giảm giá
                        // Kiểm tra: (Giá gốc - Giá bán) / Giá gốc >= tỷ lệ giảm
                        { $gte: [{ $divide: [{ $subtract: ["$originalPrice", "$price"] }, "$originalPrice"] }, minFraction] }
                    ]
                };
            }
        }

        // Tìm kiếm Text Search (Tìm theo tên, danh mục con)
        if (search) {
            // Dùng $regex để tìm kiếm tương đối không phân biệt hoa/thường ($options: 'i')
            andConditions.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { subCategory: { $regex: search, $options: 'i' } },
                    { subCategoryLabel: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Gộp tất cả các điều kiện $and vào query
        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        // --- 4. Sắp xếp (Sort) ---
        let sortOption = { createdAt: -1, _id: -1 }; // Mặc định: Mới nhất
        if (sort === 'price-asc') {
            sortOption = { price: 1, _id: -1 };      // Giá thấp đến cao
        } else if (sort === 'price-desc') {
            sortOption = { price: -1, _id: -1 };     // Giá cao đến thấp
        } else if (sort === 'popular') {
            sortOption = { rating: -1, _id: -1 };    // Được đánh giá cao nhất
        } else if (sort === 'best-selling') {
            sortOption = { soldQuantity: -1, _id: -1 }; // Bán chạy nhất
        }

        // --- 5. Thực thi Query ---
        const productsQuery = ProductModel.find(query).sort(sortOption);
        
        // Áp dụng giới hạn số lượng (nếu có)
        if (Number.isFinite(limitNumber)) {
            productsQuery.limit(limitNumber);
        }

        const products = await productsQuery;
        
        // --- 6. Lưu kết quả vào Cache ---
        // Cache dữ liệu trong 300 giây (5 phút) để dùng cho các request giống hệt sau này
        await setCache(cacheKey, products, 300); 
        
        res.json({ success: true, products });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Thêm một sản phẩm mới
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
    try {
        const { _id, __v, ...newProductData } = req.body;
        
        // Nếu không có ID sản phẩm, tự tạo ID ngẫu nhiên
        if (!newProductData.id) {
            newProductData.id = `LF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }

        const newProduct = new ProductModel(newProductData);
        await newProduct.save();
        
        // Đồng bộ dữ liệu sang ProductVariantModel
        await syncProductVariants(newProduct);
        
        // Xóa TẤT CẢ cache liên quan đến danh sách sản phẩm
        await delCache('products:*', true);
        invalidateCache('/api/products');
        
        log(`Đã thêm sản phẩm thành công: ${newProduct.id}`);
        return res.json({ success: true, message: 'Thêm sản phẩm thành công', product: newProduct });
    } catch (error) {
        log(`Lỗi khi thêm sản phẩm: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message || 'Lỗi khi thêm sản phẩm mới' });
    }
};

/**
 * @desc    Cập nhật thông tin sản phẩm
 * @route   PUT /api/products
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
    try {
        const { id, _id, __v, ...data } = req.body;
        
        if (!id && !_id) {
            return res.status(400).json({ success: false, message: 'Thiếu mã ID sản phẩm' });
        }

        let updatedProduct = null;
        if (id) {
            updatedProduct = await ProductModel.findOneAndUpdate({ id }, { $set: data }, { new: true, runValidators: false });
        }
        if (!updatedProduct && _id) {
            updatedProduct = await ProductModel.findByIdAndUpdate(_id, { $set: data }, { new: true, runValidators: false });
        }
        
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
        }
        
        // Đồng bộ dữ liệu sang ProductVariantModel
        await syncProductVariants(updatedProduct);
        
        // Xoá cache để cập nhật dữ liệu mới cho user
        await delCache('products:*', true);
        if (id) await delCache(`product:${id}`, false);
        invalidateCache('/api/products');
        
        log(`Đã cập nhật sản phẩm thành công: ${id || _id}`);
        return res.json({ success: true, message: 'Cập nhật thành công', product: updatedProduct });
    } catch (error) {
        log(`Lỗi khi cập nhật sản phẩm: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message || 'Lỗi khi cập nhật sản phẩm' });
    }
};

/**
 * @desc    Xóa sản phẩm
 * @route   DELETE /api/products
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
    try {
        const id = typeof req.query.id === 'string' ? req.query.id : undefined;
        const _id = typeof req.query._id === 'string' ? req.query._id : undefined;
        const targetId = id || _id;

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'Thiếu mã ID sản phẩm cần xóa' });
        }
        
        // BẢO VỆ DỮ LIỆU: KHÔNG CHO PHÉP XÓA VĨNH VIỄN SẢN PHẨM
        return res.status(400).json({ 
            success: false, 
            message: 'Hệ thống bảo vệ dữ liệu: Không được phép XÓA sản phẩm để bảo vệ lịch sử đơn hàng và báo cáo doanh thu. Vui lòng chuyển sản phẩm sang trạng thái ẨN.' 
        });
    } catch (error) {
        log(`Lỗi khi xóa sản phẩm: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa sản phẩm' });
    }
};

/**
 * @desc    Lấy danh sách đánh giá của 1 sản phẩm
 * @route   GET /api/products/reviews
 * @access  Public
 */
const getProductReviews = async (req, res, next) => {
    try {
        const { product_id } = req.query;
        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }
        
        // Chỉ lấy những bình luận đã được admin duyệt ('approved')
        const reviews = await ProductReviewModel.find({ product_id, status: 'approved' }).sort({ createdAt: -1 });
        
        res.json({ success: true, reviews });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Viết đánh giá cho sản phẩm
 * @route   POST /api/products/reviews
 * @access  Public (Ai cũng có thể đánh giá, nhưng có thể bị kiểm duyệt sau)
 */
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
            status: 'approved' // Chú ý: Ở đây đang để auto duyệt. Nếu muốn kiểm duyệt thì đổi thành 'pending'
        });

        await newReview.save();
        log(`Đã tạo đánh giá: ${reviewId} cho sản phẩm: ${product_id}`);

        // --- Cập nhật lại Rating trung bình vào bảng Product ---
        const allProductReviews = await ProductReviewModel.find({ product_id, status: 'approved' });
        
        const avgRating = allProductReviews.length > 0
            ? allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length
            : 5;

        // Làm tròn 1 chữ số thập phân, vd: 4.5
        await ProductModel.findOneAndUpdate(
            { id: product_id },
            {
                rating: Math.round(avgRating * 10) / 10,
                reviews: allProductReviews.length
            }
        );

        // Đánh giá thay đổi -> Xoá cache chi tiết sản phẩm
        await delCache(`product:${product_id}`, false);

        res.json({ success: true, message: 'Gửi đánh giá thành công', review: newReview });
    } catch (error) {
        log(`Lỗi khi tạo đánh giá: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Lấy chi tiết 1 sản phẩm kèm các biến thể (variants) của nó
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }

        // --- Cache Layer ---
        const cacheKey = `product:${id}`;
        const cachedProduct = await getCache(cacheKey);
        
        if (cachedProduct) {
            return res.json({ success: true, product: cachedProduct, cached: true });
        }

        // Tìm thông tin gốc của sản phẩm
        const product = await ProductModel.findOne({ id });
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        // Tìm tất cả các biến thể thuộc sản phẩm này trong collection Variant
        const variantList = await ProductVariantModel.find({
            product_id: product.id
        });

        // Gộp data trả về (Product + Array Variants)
        const productData = {
            ...product.toObject(),
            variants: variantList
        };

        // Lưu vào cache 5 phút
        await setCache(cacheKey, productData, 300);
        log(`Lấy chi tiết sản phẩm: ${id} với ${variantList.length} biến thể`);

        res.json({ success: true, product: productData });
    } catch (error) {
        log(`Lỗi lấy chi tiết sản phẩm: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Đồng bộ lại toàn bộ số lượng Đã bán (soldQuantity) dựa trên đơn hàng đã giao (delivered)
 * @route   POST /api/products/sync-sold-quantity
 * @access  Private/Admin
 */
const syncSoldQuantity = async (req, res, next) => {
    try {
        log('Bắt đầu đồng bộ số lượng đã bán (soldQuantity)...');
        
        // 1. Reset toàn bộ soldQuantity về 0
        await ProductModel.updateMany({}, { soldQuantity: 0 });
        
        // 2. Tìm tất cả đơn hàng giao thành công
        const deliveredOrders = await OrderModel.find({ status: 'delivered' });
        
        // 3. Tính toán tổng bán cho từng sản phẩm
        const soldCounts = {}; // { productId: quantity }
        for (const order of deliveredOrders) {
            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    const productId = item.product.id;
                    const qty = item.quantity || 1;
                    soldCounts[productId] = (soldCounts[productId] || 0) + qty;
                }
            }
        }
        
        // 4. Cập nhật lại vào ProductModel
        const updatePromises = Object.keys(soldCounts).map(productId => {
            return ProductModel.findOneAndUpdate(
                { id: productId },
                { soldQuantity: soldCounts[productId] }
            );
        });
        
        await Promise.all(updatePromises);
        
        // Xóa cache
        await delCache('products:*', true);
        
        log(`Hoàn tất đồng bộ soldQuantity. Đã quét ${deliveredOrders.length} đơn hàng.`);
        res.json({ 
            success: true, 
            message: 'Đồng bộ lượt bán thành công',
            totalDeliveredOrders: deliveredOrders.length,
            productsUpdated: Object.keys(soldCounts).length
        });
    } catch (error) {
        log(`Lỗi khi đồng bộ soldQuantity: ${error.message}`);
        next(error);
    }
};

// --- Helper Functions ---
async function syncProductVariants(product) {
    if (!product.variants || !Array.isArray(product.variants)) return;

    const currentVariantIds = [];

    for (const v of product.variants) {
        const color = v.color || 'Mặc định';
        const size = v.size || 'Mặc định';
        const stock = v.stock || 0;
        const sku = v.sku || `${product.id}-${color}-${size}`;
        const id = `${product.id}-${color}-${size}`;

        currentVariantIds.push(id);

        await ProductVariantModel.findOneAndUpdate(
            { product_id: product.id, size_id: size, color_id: color },
            {
                $set: {
                    id,
                    product_id: product.id,
                    size_id: size,
                    color_id: color,
                    price: v.price || product.price,
                    sku,
                    stock,
                    status: product.status || 'active'
                },
                $setOnInsert: {
                    reserved_stock: 0,
                    warehouse_stocks: [{ warehouse_id: 'WH-MAIN', stock }]
                }
            },
            { upsert: true, new: true, runValidators: false }
        );
    }

    // Xoá các biến thể không còn tồn tại trong sản phẩm
    if (currentVariantIds.length > 0) {
        await ProductVariantModel.deleteMany({
            product_id: product.id,
            id: { $nin: currentVariantIds }
        });
    }
}

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductReviews,
    createProductReview,
    syncSoldQuantity
};
