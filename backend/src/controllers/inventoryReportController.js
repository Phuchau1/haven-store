const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');
const { StockTransactionModel } = require('../models/StockTransaction');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await ProductModel.countDocuments();
        const totalSKUs = await ProductVariantModel.countDocuments();

        const variants = await ProductVariantModel.find();
        
        let totalStock = 0;
        let totalStockValue = 0;
        let lowStockSKUs = 0;
        let outOfStockSKUs = 0;

        for (const variant of variants) {
            totalStock += variant.stock;
            totalStockValue += variant.stock * (variant.price || 0); // Có thể thay bằng giá vốn nếu có

            if (variant.stock <= 0) outOfStockSKUs++;
            else if (variant.stock <= 10) lowStockSKUs++;
        }

        // Nhập / Xuất hôm nay
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayTxns = await StockTransactionModel.find({
            createdAt: { $gte: startOfDay }
        });

        let importsToday = 0;
        let exportsToday = 0;

        for (const txn of todayTxns) {
            if (txn.type === 'IMPORT' || txn.type === 'RETURN') importsToday += txn.quantity;
            else if (txn.type === 'EXPORT') exportsToday += Math.abs(txn.quantity);
        }

        res.json({
            success: true,
            data: {
                totalProducts,
                totalSKUs,
                totalStock,
                totalStockValue,
                lowStockSKUs,
                outOfStockSKUs,
                importsToday,
                exportsToday
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const { warehouse_id, type, limit = 50, skip = 0 } = req.query;
        let query = {};
        if (warehouse_id) query.warehouse_id = warehouse_id;
        if (type) query.type = type;

        const txns = await StockTransactionModel.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));
        
        const total = await StockTransactionModel.countDocuments(query);

        res.json({ success: true, data: txns, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
