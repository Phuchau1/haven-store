/**
 * ============================================================
 * CONTROLLER: SẢN PHẨM (Product)
 * Mô tả: Xử lý các logic liên quan đến danh sách sản phẩm,
 *        chi tiết sản phẩm, lọc, tìm kiếm, đánh giá và Redis Cache.
 * ============================================================
 */
const { ProductModel } = require('../models/Product');
const { getCache, setCache, delCache } = require('../utils/redisClient');
const { ProductReviewModel } = require('../models/ProductReview');
const { ProductVariantModel } = require('../models/ProductVariant');

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

        const { category, subCategory, search, sort, discounted, discount, limit } = req.query;
        const limitNumber = limit ? parseInt(limit, 10) : undefined;

        let query = {};
        const andConditions = [];

        // --- 3. Xây dựng điều kiện lọc (Filters) ---

        // Lọc theo Danh mục (Category)
        if (category) {
            if (category.startsWith('cat-')) {
                andConditions.push({ $or: [{ category_id: category }, { category: category }] });
            } else {
                query.category = category;
            }
        }

        // Lọc theo Danh mục con
        if (subCategory) {
            query.subCategory = subCategory;
        }

        // Lọc các sản phẩm Đang giảm giá (bất kỳ mức nào)
        if (discounted === 'true' && !discount) {
            // Lấy sản phẩm có Giá gốc > Giá bán
            query.$expr = { $gt: ["$originalPrice", "$price"] };
        }

        // Lọc sản phẩm theo % giảm giá tối thiểu
        if (discount) {
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
        const newProductData = req.body;
        
        // Nếu không có ID sản phẩm, tự tạo ID ngẫu nhiên (bắt đầu bằng 'sp-')
        if (!newProductData.id) {
            newProductData.id = `sp-${Math.random().toString(36).substr(2, 9)}`;
        }

        const newProduct = new ProductModel(newProductData);
        await newProduct.save();
        
        // Xóa TẤT CẢ cache liên quan đến danh sách sản phẩm để đảm bảo dữ liệu luôn mới nhất
        await delCache('products:*', true);
        
        log(`Đã thêm sản phẩm: ${newProduct.id}`);
        res.json({ success: true, message: 'Thêm sản phẩm thành công', product: newProduct });
    } catch (error) {
        log(`Lỗi khi thêm sản phẩm: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Cập nhật thông tin sản phẩm
 * @route   PUT /api/products
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
    try {
        const { id, ...data } = req.body;
        
        // Tìm và sửa (findOneAndUpdate) theo trường 'id' tuỳ chỉnh, không phải MongoDB _id
        const updatedProduct = await ProductModel.findOneAndUpdate({ id }, data, { new: true });
        
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        
        // Xoá cache để cập nhật dữ liệu mới cho user
        await delCache('products:*', true);
        await delCache(`product:${id}`, false); // Xóa luôn cache trang chi tiết của sản phẩm này
        
        log(`Đã cập nhật sản phẩm: ${id}`);
        res.json({ success: true, message: 'Cập nhật thành công', product: updatedProduct });
    } catch (error) {
        log(`Lỗi khi cập nhật sản phẩm: ${error.message}`);
        next(error);
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
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }
        
        const deletedProduct = await ProductModel.findOneAndDelete({ id });
        
        // Xoá cache list và detail
        await delCache('products:*', true);
        await delCache(`product:${id}`, false);
        
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        
        log(`Đã xóa sản phẩm: ${id}`);
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        log(`Lỗi khi xóa sản phẩm: ${error.message}`);
        next(error);
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
        const variantList = await VariantModel.find({
            id_san_pham: product.id
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

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductReviews,
    createProductReview
};
