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

        // Biểu đồ nhập xuất 7 ngày gần nhất
        const chartLabels = [];
        const importData = [];
        const exportData = [];
        
        const last7Days = [];
        const now = new Date();
        const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(todayStr.getTime() - i * 24 * 60 * 60 * 1000);
            last7Days.push(date);
            chartLabels.push(`T${date.getDate()}/${date.getMonth()+1}`);
        }
        
        const weekTxns = await StockTransactionModel.find({
            createdAt: { $gte: last7Days[0] }
        });
        
        for (let i = 0; i < 7; i++) {
            const dateStart = last7Days[i];
            const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);
            
            const dailyTxns = weekTxns.filter(t => {
                const d = new Date(t.createdAt);
                return d >= dateStart && d < dateEnd;
            });
            
            let dImport = 0;
            let dExport = 0;
            for (const txn of dailyTxns) {
                if (txn.type === 'IMPORT' || txn.type === 'RETURN') dImport += txn.quantity;
                else if (txn.type === 'EXPORT') dExport += Math.abs(txn.quantity);
            }
            importData.push(dImport);
            exportData.push(dExport);
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
                exportsToday,
                chartLabels,
                importData,
                exportData
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
