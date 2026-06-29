/**
 * ============================================================
 * CONTROLLER: FLASH SALE (Chương trình khuyến mãi giảm giá sốc)
 * Mô tả: Xử lý logic hiển thị Flash Sale đang diễn ra cho user, 
 *        quản lý CRUD Flash Sale cho Admin và thống kê Dashboard.
 * ============================================================
 */
const { FlashSaleModel } = require('../models/FlashSale');
const { ProductModel } = require('../models/Product');

/**
 * @desc Lấy chương trình Flash Sale ĐANG DIỄN RA (dành cho người dùng)
 * @route GET /api/flash-sales/active
 */
const getActiveFlashSale = async (req, res) => {
    try {
        const now = new Date();
        // Lấy Flash Sale có cờ isActive, và nằm trong khung giờ hiện tại
        const activeFlashSale = await FlashSaleModel.findOne({
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gt: now }
        }).populate('products.productDoc'); // Join dữ liệu gốc của sản phẩm

        if (!activeFlashSale) {
            return res.json({ success: true, data: null });
        }

        // --- Định dạng lại dữ liệu trả về cho Frontend ---
        const products = activeFlashSale.products
            .map(fp => {
                const p = fp.productDoc;
                if (!p) return null;
                
                // Tránh sửa trực tiếp vào document DB
                const pObj = p.toObject ? p.toObject() : p;
                
                // Đè giá bán thông thường bằng giá Flash Sale
                pObj.price = fp.flashSalePrice; 
                pObj.originalPrice = p.price; // Lưu lại giá cũ để gạch ngang hiển thị
                
                // Trạng thái tồn kho riêng của Flash Sale
                pObj.flashSaleSold = fp.soldQuantity;
                pObj.flashSaleStock = fp.stockQuantity;
                
                // Tự tính % giảm giá
                pObj.discountPercentage = Math.round((1 - fp.flashSalePrice / p.price) * 100);
                pObj.flashSaleVariants = fp.variants || []; 
                
                return pObj;
            })
            .filter(Boolean);

        return res.json({
            success: true,
            data: {
                id: activeFlashSale._id,
                name: activeFlashSale.name,
                endTime: activeFlashSale.endTime,
                products: products
            }
        });
    } catch (error) {
        console.error("getActiveFlashSale error:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc Lấy toàn bộ danh sách Flash Sale cho Admin
 */
const getAdminFlashSales = async (req, res) => {
    try {
        const flashSales = await FlashSaleModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: flashSales });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc Admin tạo mới một đợt Flash Sale
 */
const createFlashSale = async (req, res) => {
    try {
        const { name, startTime, endTime, isActive, products } = req.body;
        
        // Kiểm tra xem tất cả các sản phẩm có thực sự tồn tại trong DB không
        if (products && products.length > 0) {
            for (let p of products) {
                const prod = await ProductModel.findOne({ id: p.productId });
                if (!prod) {
                    return res.status(400).json({ success: false, message: `Sản phẩm ${p.productId} không tồn tại` });
                }
            }
        }

        const newFlashSale = new FlashSaleModel({
            name, startTime, endTime, isActive, products
        });
        await newFlashSale.save();
        res.json({ success: true, data: newFlashSale });
    } catch (error) {
        console.error("createFlashSale error:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc Admin cập nhật Flash Sale (Thêm/Sửa sản phẩm, đổi ngày giờ)
 */
const updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime, isActive, products } = req.body;
        
        if (products && products.length > 0) {
            for (let p of products) {
                const prod = await ProductModel.findOne({ id: p.productId });
                if (!prod) {
                    return res.status(400).json({ success: false, message: `Sản phẩm ${p.productId} không tồn tại` });
                }
            }
        }

        const updated = await FlashSaleModel.findByIdAndUpdate(
            id,
            { name, startTime, endTime, isActive, products },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình Flash sale' });
        }
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc Xóa Flash Sale
 */
const deleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await FlashSaleModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình Flash sale' });
        }
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc Thống kê dữ liệu Dashboard riêng cho Flash Sale
 */
const getFlashSaleDashboard = async (req, res) => {
    try {
        const flashSales = await FlashSaleModel.find().populate('products.productDoc');
        const now = new Date();
        
        let totalActive = 0;
        let totalRevenue = 0;
        let totalSold = 0;
        let upcomingOrEndingSoon = [];
        let productStats = {}; // Theo dõi thống kê của từng sản phẩm
        
        for (let fs of flashSales) {
            // Đếm số lượng chương trình đang chạy
            if (fs.isActive && fs.startTime <= now && fs.endTime > now) {
                totalActive++;
            }
            
            // Tìm các chương trình sắp kết thúc (trong vòng 24h tới)
            if (fs.isActive && fs.endTime > now && (fs.endTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000)) {
                upcomingOrEndingSoon.push({
                    id: fs._id,
                    name: fs.name,
                    endTime: fs.endTime,
                    status: 'ending_soon'
                });
            }

            totalRevenue += fs.revenue;
            totalSold += fs.totalSold;

            // Phân tích và tính toán các sản phẩm bán chạy nhất trong đợt Sale
            for (let p of fs.products) {
                let pSold = 0;
                let pRev = 0;

                if (p.variants && p.variants.length > 0) {
                    pSold = p.variants.reduce((total, v) => total + v.soldQuantity, 0);
                    pRev = p.variants.reduce((total, v) => total + (v.soldQuantity * v.flashSalePrice), 0);
                } else {
                    pSold = p.soldQuantity;
                    pRev = p.soldQuantity * p.flashSalePrice;
                }

                if (pSold > 0 && p.productDoc) {
                    const pid = p.productDoc.id;
                    const pName = p.productDoc.name;
                    
                    if (!productStats[pid]) {
                         productStats[pid] = { id: pid, name: pName, sold: 0, revenue: 0 };
                    }
                    productStats[pid].sold += pSold;
                    productStats[pid].revenue += pRev;
                }
            }
        }

        // Sắp xếp các sự kiện sắp kết thúc lên đầu
        upcomingOrEndingSoon.sort((a, b) => a.endTime - b.endTime);

        // Top 5 sản phẩm bán chạy nhất từ tất cả các Flash Sale
        const topProducts = Object.values(productStats)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                totalActive,
                totalRevenue,
                totalSold,
                endingSoon: upcomingOrEndingSoon.slice(0, 5),
                topProducts
            }
        });

    } catch (error) {
        console.error("getFlashSaleDashboard error:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

module.exports = {
    getActiveFlashSale,
    getAdminFlashSales,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    getFlashSaleDashboard
};
