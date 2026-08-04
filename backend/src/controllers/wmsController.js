/**
 * ============================================================
 * CONTROLLER: WMS ENTERPRISE & LOGISTICS MANAGEMENT
 * ============================================================
 */

const Inventory            = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const { OrderModel }       = require('../models/Order');
const { AuditLogModel: AuditLog } = require('../models/AuditLog');
const { ProductModel }            = require('../models/Product');
const wmsInventoryService  = require('../services/wmsInventoryService');
const logisticsService     = require('../services/logisticsService');
const logger               = require('../utils/logger');

/**
 * @route   GET /api/wms/dashboard
 * @desc    Lấy tổng quan chỉ số kho WMS (Valuation, SKU, Stock Levels)
 */
exports.getWmsDashboard = async (req, res) => {
    try {
        // Luôn đảm bảo đồng bộ từ các sản phẩm mới nhất trong MongoDB
        await autoSeedWmsData();
        let allItems = await Inventory.find({}).lean();

        // Tính tổng số lượng đã bán từ các Đơn hàng thực tế trong MongoDB
        const deliveredOrders = await OrderModel.find({ status: { $in: ['delivered', 'completed', 'refunded'] } }).lean();
        const salesBySku = {};
        deliveredOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const pId = item.product?.id || item.product?._id || item.product;
                if (pId) {
                    salesBySku[pId] = (salesBySku[pId] || 0) + (item.quantity || 1);
                }
            });
        });

        let totalSkus = allItems.length;
        let totalValuation = 0;
        let totalAvailable = 0;
        let totalReserved = 0;
        let totalSold = 0;
        let totalDamaged = 0;

        let inStockCount = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        allItems.forEach(item => {
            // Đồng bộ sold nếu có dữ liệu từ đơn hàng thật
            if (salesBySku[item.productId]) {
                item.sold = salesBySku[item.productId];
            }

            totalValuation += (item.available * (item.costPrice || item.sellingPrice || 0));
            totalAvailable += item.available;
            totalReserved  += item.reserved;
            totalSold      += item.sold;
            totalDamaged   += item.damaged;

            if (item.available === 0) outOfStockCount++;
            else if (item.available <= item.minStock) lowStockCount++;
            else inStockCount++;
        });

        // Top sản phẩm tồn nhiều nhất
        const topStocked = [...allItems].sort((a, b) => b.available - a.available).slice(0, 5);

        // Top sản phẩm bán chạy nhất
        const topSold = [...allItems].sort((a, b) => b.sold - a.sold).slice(0, 5);

        return res.json({
            success: true,
            data: {
                totalSkus,
                totalValuation,
                totalAvailable,
                totalReserved,
                totalSold,
                totalDamaged,
                statusBreakdown: {
                    inStock: inStockCount,
                    lowStock: lowStockCount,
                    outOfStock: outOfStockCount
                },
                topStocked,
                topSold
            }
        });
    } catch (err) {
        logger.error(`[WMSController:getDashboard] Error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi lấy báo cáo kho WMS.' });
    }
};

/**
 * @route   POST /api/wms/adjust
 * @desc    Điều chỉnh tăng/giảm tồn kho thủ công có lý do bắt buộc và lưu vết bất biến
 */
exports.adjustStock = async (req, res) => {
    try {
        const { sku, adjustQty, reason, performedBy } = req.body;
        if (!sku || adjustQty === undefined || adjustQty === 0 || !reason?.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin SKU, số lượng điều chỉnh hoặc lý do bắt buộc' });
        }

        const user = performedBy || req.user?.name || 'Admin WMS';
        const userIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

        const result = await wmsInventoryService.adjustStock({
            sku,
            adjustQty: Number(adjustQty),
            reason,
            performedBy: user,
            deviceIp: userIp
        });

        // Ghi Audit Log
        try {
            await AuditLog.create({
                action: 'INVENTORY_MANUAL_ADJUST',
                entity_type: 'Inventory',
                entity_id: sku,
                user_id: user || 'system',
                ip_address: userIp || '127.0.0.1',
                notes: `Điều chỉnh tồn kho ${adjustQty > 0 ? '+' : ''}${adjustQty} cho SKU ${sku}. Lý do: ${reason}`
            });
        } catch (auditErr) {
            logger.error(`[AuditLog] Không ghi được log điều chỉnh kho: ${auditErr.message}`);
        }

        return res.json({
            success: true,
            message: `✅ Đã điều chỉnh tồn kho SKU ${sku} thành công`,
            data: result
        });
    } catch (err) {
        logger.error(`[WMS] Adjust stock error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi hệ thống khi điều chỉnh tồn kho' });
    }
};

/**
 * @route   GET /api/wms/notifications
 * @desc    Lấy danh sách thông báo & cảnh báo tồn kho (Low Stock / Out of Stock)
 */
exports.getNotifications = async (req, res) => {
    try {
        const lowStockItems = await Inventory.find({
            $expr: { $lte: ['$available', '$minStock'] }
        }).lean();

        const notifications = lowStockItems.map(item => ({
            id: item._id,
            type: item.available === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            title: item.available === 0 ? `🚨 Hết hàng: ${item.sku}` : `⚠️ Sắp hết hàng: ${item.sku}`,
            message: `${item.productName} (${item.color}/${item.size}) hiện còn ${item.available} sp trong kho (Ngưỡng an toàn: ${item.minStock} sp).`,
            sku: item.sku,
            available: item.available,
            minStock: item.minStock,
            createdAt: item.updatedAt || item.createdAt
        }));

        return res.json({
            success: true,
            total: notifications.length,
            data: notifications
        });
    } catch (err) {
        logger.error(`[WMS] Get notifications error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thông báo kho' });
    }
};

/**
 * @route   GET /api/wms/export
 * @desc    Xuất báo cáo tồn kho SKU dưới dạng CSV/Excel
 */
exports.exportInventory = async (req, res) => {
    try {
        const items = await Inventory.find({}).lean();
        const headers = ['SKU', 'Tên Sản Phẩm', 'Màu', 'Size', 'Vị Trí Kệ', 'Tồn Bán (Available)', 'Tồn Giữ (Reserved)', 'Đã Bán', 'Lỗi (Damaged)', 'Giá Nhập (VND)', 'Trạng Thái'];
        
        const rows = items.map(i => [
            `"${i.sku}"`,
            `"${i.productName?.replace(/"/g, '""') || ''}"`,
            `"${i.color || ''}"`,
            `"${i.size || ''}"`,
            `"${i.locationRack || ''}"`,
            i.available || 0,
            i.reserved || 0,
            i.sold || 0,
            i.damaged || 0,
            i.costPrice || 0,
            `"${i.status || 'IN_STOCK'}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=Bao_Cao_Ton_Kho_WMS_${Date.now()}.csv`);
        return res.send(csvContent);
    } catch (err) {
        logger.error(`[WMS] Export CSV error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi xuất file dữ liệu tồn kho' });
    }
};

/**
 * @route   POST /api/wms/import
 * @desc    Bulk Import / Cập nhật tồn kho SKU từ dữ liệu hàng loạt
 */
exports.importInventory = async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng truyền mảng danh sách items cần import' });
        }

        let updatedCount = 0;
        const performedBy = req.body.performedBy || 'Admin Import';

        for (const item of items) {
            if (!item.sku) continue;
            
            const existing = await Inventory.findOne({ sku: item.sku });
            const beforeAvailable = existing ? existing.available : 0;
            const newAvailable = Number(item.available !== undefined ? item.available : (existing ? existing.available : 0));

            await Inventory.updateOne(
                { sku: item.sku },
                {
                    $set: {
                        productName: item.productName || existing?.productName || item.sku,
                        color: item.color || existing?.color || '',
                        size: item.size || existing?.size || '',
                        available: newAvailable,
                        minStock: item.minStock || existing?.minStock || 5,
                        costPrice: item.costPrice || existing?.costPrice || 0,
                        locationRack: item.locationRack || existing?.locationRack || 'KHO-MAIN-01',
                        status: newAvailable === 0 ? 'OUT_OF_STOCK' : (newAvailable <= (item.minStock || 5) ? 'LOW_STOCK' : 'IN_STOCK')
                    }
                },
                { upsert: true }
            );

            // Ghi nhận lịch sử giao dịch
            if (newAvailable !== beforeAvailable) {
                await InventoryTransaction.create({
                    transactionCode: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    type: newAvailable > beforeAvailable ? 'IMPORT' : 'ADJUST_DECREASE',
                    sku: item.sku,
                    productName: item.productName || item.sku,
                    quantityBefore: beforeAvailable,
                    quantityChange: newAvailable - beforeAvailable,
                    quantityAfter: newAvailable,
                    stockType: 'available',
                    performedBy,
                    notes: 'Bulk Import/Cập nhật tồn kho từ dữ liệu file'
                });
            }
            updatedCount++;
        }

        return res.json({
            success: true,
            message: `✅ Đã import / cập nhật thành công ${updatedCount} SKU vào kho`,
            updatedCount
        });
    } catch (err) {
        logger.error(`[WMS] Import inventory error: ${err.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi xử lý import hàng loạt' });
    }
};

/**
 * @route   GET /api/wms/inventory
 * @desc    Danh sách tồn kho có Pagination, Search, Filter, Sort
 */
exports.getInventoryList = async (req, res) => {
    try {
        const page  = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || '';
        const status = req.query.status || '';

        const query = {};
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) query.status = status;

        let totalItems = await Inventory.countDocuments(query);

        // Tự động Seed nếu trống
        if (totalItems === 0 && !search && !status) {
            await autoSeedWmsData();
            totalItems = await Inventory.countDocuments(query);
        }

        const items = await Inventory.find(query)
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            items,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   POST /api/wms/stocktake
 * @desc    Thực hiện kiểm kê & cân bằng tồn kho thực tế
 */
exports.performStocktake = async (req, res) => {
    try {
        const { items, notes, user = 'Admin WMS' } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách kiểm kê không được rỗng.' });
        }

        const auditResults = await wmsInventoryService.auditStocktake(items, user, notes);

        return res.json({
            success: true,
            message: 'Đã hoàn tất kiểm kê & cân bằng kho thành công!',
            auditResults
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   POST /api/wms/waybill
 * @desc    Tạo vận đơn giao hàng GHN / GHTK / ViettelPost
 */
exports.createCarrierWaybill = async (req, res) => {
    try {
        const { orderData, carrierCode = 'GHN' } = req.body;
        if (!orderData) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu đơn hàng.' });
        }

        const waybill = await logisticsService.createWaybill(orderData, carrierCode);

        // 1. Cập nhật trực tiếp vào MongoDB Database (LƯU PERSISTENT)
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { id: orderData.id },
            {
                $set: {
                    status: 'shipped',
                    carrierCode: waybill.carrierCode,
                    trackingNumber: waybill.trackingNumber,
                    shippingProvider: waybill.carrierName
                }
            },
            { new: true }
        );

        // 2. Chuyển tồn kho từ reserved -> sold
        if (orderData.items) {
            await wmsInventoryService.deductStockOnShipment(orderData.id || orderData._id, orderData.items);
        }

        return res.json({
            success: true,
            waybill,
            order: updatedOrder
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   POST /api/wms/return-order
 * @desc    Xử lý Hoàn Hàng Trả Về Kho (Phân loại Hàng Tốt vs Hàng Hỏng)
 */
exports.processReturnOrder = async (req, res) => {
    try {
        const { orderId, returnItems, returnType = 'RETURN_GOOD', reason = '', user = 'Admin WMS' } = req.body;
        if (!orderId || !returnItems || !Array.isArray(returnItems) || returnItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đơn hàng hoặc sản phẩm hoàn.' });
        }

        // 1. Gọi WMS Service xử lý hoàn hàng & ghi log
        const results = await wmsInventoryService.processReturnOrder(orderId, returnItems, returnType, user, reason);

        // 2. Cập nhật trạng thái Đơn Hàng trong MongoDB Database sang refunded / cancelled
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { id: orderId },
            { $set: { status: 'refunded' } },
            { new: true }
        );

        return res.json({
            success: true,
            message: `Đã xử lý hoàn hàng thành công cho Đơn #${orderId}!`,
            results,
            order: updatedOrder
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   POST /api/wms/customer-return-request
 * @desc    Khách hàng gửi yêu cầu hoàn hàng kèm hình ảnh bằng chứng & lý do (Chỉ khi order status == delivered)
 */
exports.submitCustomerReturnRequest = async (req, res) => {
    try {
        const { orderId, reason, images } = req.body;
        if (!orderId || !reason?.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng hoặc lý do hoàn hàng.' });
        }
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất 1 hình ảnh sản phẩm/hóa đơn làm bằng chứng hoàn hàng!' });
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }

        // Bắt buộc: Chỉ đơn hàng mua thành công (delivered) mới được hoàn hàng
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ các đơn hàng đã giao thành công (Mua hàng thành công) mới được phép gửi yêu cầu hoàn hàng!'
            });
        }

        order.status = 'return_requested';
        order.returnRequest = {
            status: 'pending',
            reason,
            images,
            requestedAt: new Date()
        };
        await order.save();

        try {
            await AuditLog.create({
                action: 'CUSTOMER_RETURN_REQUEST',
                entity_type: 'Order',
                entity_id: orderId,
                user_id: order.userId || order.email || 'customer',
                ip_address: req.ip || '127.0.0.1',
                notes: `Khách hàng gửi yêu cầu hoàn đơn #${orderId} với ${images.length} hình ảnh bằng chứng. Lý do: ${reason}`
            });
        } catch (auditErr) {
            logger.error(`[AuditLog] Không ghi được log return request: ${auditErr.message}`);
        }

        return res.json({
            success: true,
            message: '✅ Đã gửi yêu cầu hoàn hàng! Ban quản trị sẽ kiểm tra hình ảnh & phản hồi trong 24h.',
            order
        });
    } catch (err) {
        logger.error(`[WMS] Customer return request error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi gửi yêu cầu hoàn hàng' });
    }
};

/**
 * @route   POST /api/wms/review-return-request
 * @desc    Admin xem xét & Duyệt (Approve) hoặc Từ Chối (Reject) yêu cầu hoàn hàng của khách
 */
exports.reviewReturnRequest = async (req, res) => {
    try {
        const { orderId, action, returnType = 'RETURN_GOOD', rejectReason = '', adminName = 'Admin WMS' } = req.body;
        if (!orderId || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn hàng và hành động (approve / reject).' });
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }

        if (order.status !== 'return_requested' && order.returnRequest?.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Đơn hàng này không có yêu cầu hoàn hàng đang chờ duyệt.' });
        }

        if (action === 'approve') {
            // Chuyển các món sang WMS Service để cộng tồn khả dụng hoặc hỏng
            const returnItems = order.items.map(it => ({
                sku: `${it.product?.id || 'PROD'}-${it.selectedColor?.name?.replace(/\s/g, '-') || ''}-${it.selectedSize || ''}`,
                quantity: it.quantity,
                isDamaged: returnType === 'RETURN_DAMAGE'
            }));

            await wmsInventoryService.processReturnOrder(orderId, returnItems, returnType, adminName, order.returnRequest?.reason || 'Approved return');

            order.status = 'refunded';
            if (!order.returnRequest) order.returnRequest = {};
            order.returnRequest.status = 'approved';
            order.returnRequest.reviewedAt = new Date();
            order.returnRequest.reviewedBy = adminName;
            await order.save();

            try {
                await AuditLog.create({
                    action: 'ADMIN_APPROVE_RETURN',
                    entity_type: 'Order',
                    entity_id: orderId,
                    user_id: adminName || 'admin',
                    ip_address: req.ip || '127.0.0.1',
                    notes: `Admin ${adminName} ĐÃ DUYỆT yêu cầu hoàn hàng đơn #${orderId} (${returnType})`
                });
            } catch (auditErr) {
                logger.error(`[AuditLog] Không ghi được log approve return: ${auditErr.message}`);
            }

            return res.json({
                success: true,
                message: `✅ Đã ĐÃ DUYỆT hoàn hàng cho đơn #${orderId}! Hàng đã được nhập kho (${returnType}).`,
                order
            });
        } else {
            // Từ chối yêu cầu hoàn hàng
            if (!rejectReason?.trim()) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối để thông báo cho khách hàng.' });
            }

            order.status = 'delivered'; // Trả về đã giao
            if (!order.returnRequest) order.returnRequest = {};
            order.returnRequest.status = 'rejected';
            order.returnRequest.rejectReason = rejectReason;
            order.returnRequest.reviewedAt = new Date();
            order.returnRequest.reviewedBy = adminName;
            await order.save();

            try {
                await AuditLog.create({
                    action: 'ADMIN_REJECT_RETURN',
                    entity_type: 'Order',
                    entity_id: orderId,
                    user_id: adminName || 'admin',
                    ip_address: req.ip || '127.0.0.1',
                    notes: `Admin ${adminName} TỪ CHỐI yêu cầu hoàn đơn #${orderId}. Lý do từ chối: ${rejectReason}`
                });
            } catch (auditErr) {
                logger.error(`[AuditLog] Không ghi được log reject return: ${auditErr.message}`);
            }

            return res.json({
                success: true,
                message: `❌ Đã TỪ CHỐI yêu cầu hoàn hàng cho đơn #${orderId}.`,
                order
            });
        }
    } catch (err) {
        logger.error(`[WMS] Review return request error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi duyệt yêu cầu hoàn hàng' });
    }
};

/**
 * @route   GET /api/wms/tracking/:trackingNumber
 * @desc    Lấy lịch trình vận chuyển Live
 */
exports.getWaybillTracking = async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const tracking = await logisticsService.getLiveTracking(trackingNumber);
        return res.json({ success: true, tracking });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   GET /api/wms/audit-logs
 * @desc    Nhật ký thao tác kho Audit Log
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const page  = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const logs = await AuditLog
            ? await AuditLog.find({}).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean()
            : [];
        return res.json({ success: true, logs });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @route   GET /api/wms/transactions
 * @desc    Lịch sử giao dịch kho (Inventory Transactions)
 */
exports.getTransactions = async (req, res) => {
    try {
        const page   = parseInt(req.query.page) || 1;
        const limit  = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const type   = req.query.type || '';

        const query = {};
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { sku: { $regex: search, $options: 'i' } },
                { productName: { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } },
                { transactionCode: { $regex: search, $options: 'i' } }
            ];
        }

        const totalItems = await InventoryTransaction.countDocuments(query);
        const items = await InventoryTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return res.json({
            success: true,
            items,
            pagination: {
                page, limit, totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (err) {
        logger.error(`[WMSController:getTransactions] ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Tự động đồng bộ TẤT CẢ sản phẩm thật từ Product collection vào Inventory WMS
 * Mỗi biến thể (color + size) của mỗi sản phẩm sẽ tạo 1 SKU kho riêng
 */
async function autoSeedWmsData() {
    try {
        // Lấy toàn bộ sản phẩm thật từ MongoDB
        const products = await ProductModel.find({ status: 'published' }).lean();

        if (!products || products.length === 0) {
            logger.warn('[WMS] Không có sản phẩm nào trong DB để đồng bộ vào kho WMS.');
            return;
        }

        let syncedCount = 0;

        for (const product of products) {
            const variants = product.variants || [];
            const basePrice = product.price || 0;

            // Nếu sản phẩm có biến thể (color + size) → tạo 1 SKU per variant
            if (variants.length > 0) {
                for (const variant of variants) {
                    const colorSlug = (variant.color || 'default').replace(/\s+/g, '-').toUpperCase().replace(/[^A-Z0-9\-]/g, '');
                    const sizeSlug  = (variant.size  || 'OS').replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                    const prodSlug  = (product.id || product._id.toString()).toUpperCase().substring(0, 12);
                    const sku = `WMS-${prodSlug}-${colorSlug}-${sizeSlug}`.substring(0, 40);

                    const available = Number(variant.stock || 0);
                    const costPrice  = Math.round((variant.price || basePrice) * 0.55); // Giá vốn ~55% giá bán
                    const sellingPrice = variant.price || basePrice;

                    let status = 'IN_STOCK';
                    if (available === 0) status = 'OUT_OF_STOCK';
                    else if (available <= 10) status = 'LOW_STOCK';

                    await Inventory.updateOne(
                        { sku },
                        {
                            $setOnInsert: {
                                productId: product._id ? product._id.toString() : `PROD-${sku}`,
                                reserved: 0,
                                damaged: 0,
                                transfer: 0,
                                warehouseName: 'Tổng Kho Chính',
                                locationRack: 'KHO-AUTO-SYNC',
                                minStock: 5,
                                costPrice,
                            },
                            $set: {
                                // Luôn cập nhật thông tin sản phẩm VÀ số lượng tồn kho để đồng bộ tuyệt đối
                                sku,
                                productName: product.name,
                                color: variant.color || 'Mặc định',
                                size: variant.size || 'One Size',
                                sellingPrice,
                                available,
                                sold: product.soldQuantity || 0,
                                status
                            }
                        },
                        { upsert: true }
                    );
                    syncedCount++;
                }
            } else {
                // Sản phẩm không có biến thể → tạo 1 SKU duy nhất
                const prodSlug = (product.id || product._id.toString()).toUpperCase().substring(0, 20);
                const sku = `WMS-${prodSlug}`.substring(0, 40);
                const available = product.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 50;
                const costPrice = Math.round(basePrice * 0.55);

                let status = 'IN_STOCK';
                if (available === 0) status = 'OUT_OF_STOCK';
                else if (available <= 5) status = 'LOW_STOCK';

                await Inventory.updateOne(
                    { sku },
                    {
                        $setOnInsert: {
                            productId: product._id ? product._id.toString() : `PROD-${sku}`,
                            reserved: 0,
                            damaged: 0,
                            transfer: 0,
                            warehouseName: 'Tổng Kho Chính',
                            locationRack: 'KHO-AUTO-SYNC',
                            minStock: 5,
                            costPrice,
                        },
                        $set: {
                            sku,
                            productName: product.name,
                            color: 'Mặc định',
                            size: 'One Size',
                            sellingPrice: basePrice,
                            available,
                            sold: product.soldQuantity || 0,
                            status
                        }
                    },
                    { upsert: true }
                );
                syncedCount++;
            }
        }

        logger.info(`[WMS] Auto-sync hoàn tất: Đã đồng bộ ${syncedCount} SKU từ ${products.length} sản phẩm thật vào Inventory WMS!`);
    } catch (e) {
        logger.error(`[WMS] Auto-seed/sync error: ${e.message}`);
    }
}

/**
 * @route   POST /api/wms/sync-products
 * @desc    Đồng bộ lại toàn bộ sản phẩm từ Product collection vào Inventory WMS
 */
exports.syncProductsToInventory = async (req, res) => {
    try {
        await autoSeedWmsData();
        const total = await Inventory.countDocuments({});
        return res.json({
            success: true,
            message: `✅ Đồng bộ kho thành công! Tổng ${total} SKU trong hệ thống WMS.`,
            totalSkus: total
        });
    } catch (err) {
        logger.error(`[WMS] syncProductsToInventory error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};
