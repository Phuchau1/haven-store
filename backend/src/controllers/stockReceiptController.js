const { StockReceiptModel } = require('../models/StockReceipt');
const { StockTransactionModel } = require('../models/StockTransaction');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');

const handleStockChange = async (type, warehouse_id, items, receipt_id, user_id, dest_warehouse_id = null) => {
    // IMPORT: tăng kho hiện tại
    // EXPORT: giảm kho hiện tại
    // TRANSFER: giảm kho hiện tại, tăng kho đích
    // ADJUSTMENT: cập nhật bằng số nhập vào (chênh lệch) - tạm thời coi quantity là +/-

    for (const item of items) {
        const { variant_id, quantity, price } = item;
        
        // Tìm Variant
        const variant = await ProductVariantModel.findOne({ sku: variant_id }) || await ProductVariantModel.findOne({ id: variant_id });
        if (!variant) throw new Error(`Không tìm thấy variant: ${variant_id}`);

        // Lấy tồn kho hiện tại ở warehouse_id
        const currentWHStockIndex = variant.warehouse_stocks.findIndex(w => w.warehouse_id === warehouse_id);
        let beforeStock = currentWHStockIndex > -1 ? variant.warehouse_stocks[currentWHStockIndex].stock : 0;
        let afterStock = beforeStock;

        if (type === 'IMPORT' || type === 'RETURN') {
            afterStock = beforeStock + quantity;
        } else if (type === 'EXPORT') {
            if (beforeStock < quantity) throw new Error(`Tồn kho không đủ cho SKU: ${variant_id}`);
            afterStock = beforeStock - quantity;
        } else if (type === 'TRANSFER') {
            if (beforeStock < quantity) throw new Error(`Tồn kho không đủ cho SKU: ${variant_id} để chuyển`);
            afterStock = beforeStock - quantity;
        } else if (type === 'ADJUSTMENT') {
            afterStock = beforeStock + quantity; // quantity có thể âm
            if (afterStock < 0) throw new Error(`Điều chỉnh làm tồn kho âm cho SKU: ${variant_id}`);
        }

        // Cập nhật mảng warehouse_stocks
        if (currentWHStockIndex > -1) {
            variant.warehouse_stocks[currentWHStockIndex].stock = afterStock;
        } else {
            variant.warehouse_stocks.push({ warehouse_id, stock: afterStock });
        }

        // Cập nhật tổng stock
        const totalStockDiff = afterStock - beforeStock;
        variant.stock += totalStockDiff;
        await variant.save();

        // Đồng bộ với ProductModel (Cập nhật embedded variant array)
        const product = await ProductModel.findOne({ id: variant.product_id });
        if (product && product.variants) {
            const embedVar = product.variants.find(v => v.color === variant.color_id && v.size === variant.size_id);
            if (embedVar) {
                embedVar.stock = variant.stock; // Đồng bộ tổng stock lên storefront
                product.markModified('variants');
                await product.save();
            }
        }

        // Lưu StockTransaction cho kho nguồn
        await new StockTransactionModel({
            id: `txn-${Math.random().toString(36).substr(2, 9)}`,
            type,
            reference_id: receipt_id,
            warehouse_id,
            variant_id: variant.id,
            quantity: totalStockDiff,
            before_stock: beforeStock,
            after_stock: afterStock,
            user_id
        }).save();

        // Xử lý kho đích nếu là TRANSFER
        if (type === 'TRANSFER' && dest_warehouse_id) {
            const destIndex = variant.warehouse_stocks.findIndex(w => w.warehouse_id === dest_warehouse_id);
            let destBefore = destIndex > -1 ? variant.warehouse_stocks[destIndex].stock : 0;
            let destAfter = destBefore + quantity;
            
            if (destIndex > -1) {
                variant.warehouse_stocks[destIndex].stock = destAfter;
            } else {
                variant.warehouse_stocks.push({ warehouse_id: dest_warehouse_id, stock: destAfter });
            }
            await variant.save();
            // Storefront total stock không đổi khi chuyển kho nội bộ

            // Lưu StockTransaction cho kho đích
            await new StockTransactionModel({
                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                type: 'IMPORT', // Nhận từ transfer
                reference_id: receipt_id,
                warehouse_id: dest_warehouse_id,
                variant_id: variant.id,
                quantity: quantity,
                before_stock: destBefore,
                after_stock: destAfter,
                user_id
            }).save();
        }
    }
};

exports.getAll = async (req, res) => {
    try {
        const receipts = await StockReceiptModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: receipts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { type, warehouse_id, dest_warehouse_id, supplier_id, reason, note, user_id, items, status } = req.body;
        
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });
        
        const receipt_id = `rec-${Math.random().toString(36).substr(2, 9)}`;

        // Tính tổng
        const total_quantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
        const total_amount = items.reduce((sum, item) => sum + (Math.abs(item.quantity) * (item.price || 0)), 0);

        const receiptStatus = status || 'DRAFT';

        const receipt = new StockReceiptModel({
            id: receipt_id,
            type, warehouse_id, dest_warehouse_id, supplier_id, reason, note, user_id, items,
            total_quantity, total_amount,
            status: receiptStatus
        });

        // Xử lý trừ/cộng tồn kho nếu duyệt ngay
        if (receiptStatus === 'COMPLETED') {
            await handleStockChange(type, warehouse_id, items, receipt_id, user_id, dest_warehouse_id);
        }

        await receipt.save();
        res.status(201).json({ success: true, data: receipt });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const receipt = await StockReceiptModel.findOne({ id: req.params.id });
        if (!receipt) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kho' });
        res.json({ success: true, data: receipt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, warehouse_id, dest_warehouse_id, supplier_id, reason, note, items } = req.body;

        const receipt = await StockReceiptModel.findOne({ id });
        if (!receipt) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kho' });
        
        if (receipt.status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể sửa phiếu ở trạng thái Nháp' });
        }

        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });

        const total_quantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
        const total_amount = items.reduce((sum, item) => sum + (Math.abs(item.quantity) * (item.price || 0)), 0);

        receipt.type = type || receipt.type;
        receipt.warehouse_id = warehouse_id || receipt.warehouse_id;
        receipt.dest_warehouse_id = dest_warehouse_id || receipt.dest_warehouse_id;
        receipt.supplier_id = supplier_id || receipt.supplier_id;
        receipt.reason = reason;
        receipt.note = note;
        receipt.items = items;
        receipt.total_quantity = total_quantity;
        receipt.total_amount = total_amount;

        await receipt.save();
        res.json({ success: true, data: receipt });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.approve = async (req, res) => {
    try {
        const { id } = req.params;
        const receipt = await StockReceiptModel.findOne({ id });
        
        if (!receipt) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kho' });
        
        if (receipt.status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: 'Phiếu đã được duyệt hoặc đã hủy' });
        }

        // Xử lý tồn kho
        await handleStockChange(
            receipt.type, 
            receipt.warehouse_id, 
            receipt.items, 
            receipt.id, 
            receipt.user_id, 
            receipt.dest_warehouse_id
        );

        receipt.status = 'COMPLETED';
        await receipt.save();

        res.json({ success: true, message: 'Duyệt phiếu thành công', data: receipt });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
