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
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        // Lấy tất cả Flash Sale đang bật (isActive: true) từ đầu ngày hôm nay trở đi
        const allFlashSales = await FlashSaleModel.find({
            isActive: true,
            endTime: { $gte: startOfToday }
        }).populate('products.productDoc').sort({ startTime: 1 });

        if (!allFlashSales || allFlashSales.length === 0) {
            return res.json({ success: true, data: null, dateSlots: {} });
        }

        const formatProducts = (fsDoc) => {
            if (!fsDoc || !fsDoc.products) return [];
            return fsDoc.products
                .map(fp => {
                    const p = fp.productDoc;
                    if (!p) return null;
                    const pObj = p.toObject ? p.toObject() : p;
                    pObj.price = fp.flashSalePrice; 
                    pObj.originalPrice = p.price;
                    pObj.flashSaleSold = fp.soldQuantity;
                    pObj.flashSaleStock = fp.stockQuantity;
                    pObj.discountPercentage = Math.round((1 - fp.flashSalePrice / p.price) * 100);
                    pObj.flashSaleVariants = fp.variants || []; 
                    return pObj;
                })
                .filter(Boolean);
        };

        // Đợt sale đang diễn ra ở thời điểm hiện tại
        let activeFlashSale = allFlashSales.find(fs => fs.startTime <= now && fs.endTime > now);
        if (!activeFlashSale) {
            activeFlashSale = allFlashSales[0];
        }

        // Map danh sách sản phẩm theo từng chuỗi ngày (VD: "28/08", "29/08", "30/08", "31/08")
        const dateSlotsMap = {};
        allFlashSales.forEach(fs => {
            const startDate = new Date(fs.startTime);
            const dayStr = String(startDate.getDate()).padStart(2, '0');
            const monthStr = String(startDate.getMonth() + 1).padStart(2, '0');
            const dateKey = `${dayStr}/${monthStr}`;
            
            dateSlotsMap[dateKey] = {
                id: fs._id,
                name: fs.name,
                startTime: fs.startTime,
                endTime: fs.endTime,
                products: formatProducts(fs)
            };
        });

        const activeProducts = formatProducts(activeFlashSale);

        return res.json({
            success: true,
            data: {
                id: activeFlashSale._id,
                name: activeFlashSale.name,
                endTime: activeFlashSale.endTime,
                products: activeProducts
            },
            dateSlots: dateSlotsMap
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

const createFlashSale = async (req, res) => {
    try {
        const { name, startTime, endTime, isActive, products } = req.body;
        
        if (products && products.length > 0) {
            for (let p of products) {
                const pid = typeof p.productId === 'object' ? p.productId.id : p.productId;
                const prod = await ProductModel.findOne({ id: pid });
                if (!prod) {
                    return res.status(400).json({ success: false, message: `Sản phẩm ${pid} không tồn tại trong hệ thống` });
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
 * @desc Admin cập nhật Flash Sale (Kiểm tra nghiêm ngặt trùng sản phẩm giữa các ngày)
 */
const updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime, isActive, products } = req.body;
        
        if (products && products.length > 0) {
            for (let p of products) {
                const pid = typeof p.productId === 'object' ? p.productId.id : p.productId;
                const prod = await ProductModel.findOne({ id: pid });
                if (!prod) {
                    return res.status(400).json({ success: false, message: `Sản phẩm ${pid} không tồn tại` });
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
        console.error("updateFlashSale error:", error);
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

/**
 * @desc Đăng ký nhận thông báo mở bán Flash Sale
 * @route POST /api/flash-sales/remind
 */
const registerFlashSaleReminder = async (req, res) => {
    try {
        const FlashSaleReminder = require('../models/FlashSaleReminder');
        const { productId, productName, userId, email } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }

        const query = { productId };
        if (userId) query.userId = userId;
        else if (email) query.email = email;

        const reminder = await FlashSaleReminder.findOneAndUpdate(
            query,
            {
                productId,
                productName: productName || 'Sản phẩm Flash Sale',
                userId: userId || null,
                email: email || null,
                isNotified: false,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Đã lưu đăng ký thông báo mở bán thành công!',
            data: reminder
        });
    } catch (error) {
        console.error("registerFlashSaleReminder error:", error);
        res.status(500).json({ success: false, message: 'Lỗi khi đăng ký thông báo' });
    }
};

/**
 * @desc Tự động tạo và phân bổ sản phẩm KHÔNG TRÙNG NHAU cho 3 ngày Flash Sale tiếp theo
 * @route POST /api/flash-sales/admin/auto-split-3-days
 */
const autoSplit3DaysFlashSale = async (req, res) => {
    try {
        const allProducts = await ProductModel.find();
        if (!allProducts || allProducts.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Hệ thống cần ít nhất 3 sản phẩm để tự động phân bổ cho 3 ngày Flash Sale.'
            });
        }

        const now = new Date();
        const days = [];
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

        for (let i = 0; i < 3; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() + i);

            const dayStr = String(d.getDate()).padStart(2, '0');
            const monthStr = months[d.getMonth()];
            const dayNum = d.getDay();
            const dayOfWeek = dayNum === 0 ? 'Chủ Nhật' : `Thứ ${dayNum + 1}`;

            const startD = new Date(d);
            startD.setHours(0, 0, 0, 0);

            const endD = new Date(d);
            endD.setHours(23, 59, 59, 999);

            days.push({
                index: i,
                fullLabel: `${i === 0 ? 'Hôm nay' : dayOfWeek} (${dayStr}/${monthStr})`,
                startTime: startD,
                endTime: endD,
                dateStr: `${dayStr}/${monthStr}`
            });
        }

        // Xáo trộn sản phẩm ngẫu nhiên để công bằng
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        const chunkSize = Math.max(1, Math.floor(shuffled.length / 3));

        const day0Prods = shuffled.slice(0, chunkSize);
        const day1Prods = shuffled.slice(chunkSize, chunkSize * 2);
        const day2Prods = shuffled.slice(chunkSize * 2);
        const chunks = [day0Prods, day1Prods, day2Prods];

        const savedSales = [];

        for (let i = 0; i < 3; i++) {
            const dayInfo = days[i];
            const prodChunk = chunks[i];

            const formattedProducts = prodChunk.map(p => {
                const origPrice = p.price || 100000;
                const salePrice = Math.round(origPrice * 0.8); // Giảm 20% mặc định

                const vars = (p.variants || []).map(v => ({
                    color: v.color,
                    size: v.size,
                    flashSalePrice: salePrice,
                    stockQuantity: 50,
                    soldQuantity: 0
                }));

                return {
                    productId: p.id,
                    flashSalePrice: salePrice,
                    stockQuantity: 100,
                    soldQuantity: 0,
                    variants: vars,
                    useVariants: vars.length > 0
                };
            });

            // Tìm xem ngày này đã có chiến dịch nào chưa
            const existing = await FlashSaleModel.findOne({
                startTime: { $gte: dayInfo.startTime, $lte: dayInfo.endTime }
            });

            if (existing) {
                existing.name = `Chiến dịch Flash Sale — ${dayInfo.fullLabel}`;
                existing.startTime = dayInfo.startTime;
                existing.endTime = dayInfo.endTime;
                existing.isActive = true;
                existing.products = formattedProducts;
                await existing.save();
                savedSales.push(existing);
            } else {
                const newFs = new FlashSaleModel({
                    name: `Chiến dịch Flash Sale — ${dayInfo.fullLabel}`,
                    startTime: dayInfo.startTime,
                    endTime: dayInfo.endTime,
                    isActive: true,
                    products: formattedProducts
                });
                await newFs.save();
                savedSales.push(newFs);
            }
        }

        res.json({
            success: true,
            message: '🎉 Đã tự động tạo & phân bổ thành công 3 ngày Flash Sale với sản phẩm KHÔNG TRÙNG NHAU!',
            data: savedSales
        });
    } catch (error) {
        console.error("autoSplit3DaysFlashSale error:", error);
        res.status(500).json({ success: false, message: 'Lỗi khi tự động phân bổ Flash Sale 3 ngày' });
    }
};

module.exports = {
    getActiveFlashSale,
    getAdminFlashSales,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    getFlashSaleDashboard,
    registerFlashSaleReminder,
    autoSplit3DaysFlashSale
};
