/**
 * ============================================================
 * CONTROLLER: WMS ENTERPRISE & LOGISTICS MANAGEMENT
 * ============================================================
 */

const Inventory            = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const { AuditLogModel: AuditLog } = require('../models/AuditLog');
const wmsInventoryService  = require('../services/wmsInventoryService');
const logisticsService     = require('../services/logisticsService');
const logger               = require('../utils/logger');

/**
 * @route   GET /api/wms/dashboard
 * @desc    Lấy tổng quan chỉ số kho WMS (Valuation, SKU, Stock Levels)
 */
exports.getWmsDashboard = async (req, res) => {
    try {
        const allItems = await Inventory.find({}).lean();

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

        const totalItems = await Inventory.countDocuments(query);
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

        // Chuyển hàng từ reserved -> sold
        if (orderData.items) {
            await wmsInventoryService.deductStockOnShipment(orderData.id || orderData._id, orderData.items);
        }

        return res.json({
            success: true,
            waybill
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
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
