/**
 * ============================================================
 * CONTROLLER: PHIẾU KHO (Stock Receipt)
 * Mô tả: Quản lý nghiệp vụ Nhập (IMPORT), Xuất (EXPORT), 
 *        Chuyển kho nội bộ (TRANSFER) và Kiểm kê (ADJUSTMENT).
 * Lưu ý quan trọng: Logic handleStockChange xử lý việc cộng/trừ
 *        vào từng kho cụ thể (warehouse_stocks) của biến thể.
 * ============================================================
 */
const { StockReceiptModel } = require('../models/StockReceipt');
const { StockTransactionModel } = require('../models/StockTransaction');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');

/**
 * @desc Xử lý thay đổi số lượng kho thật khi phiếu kho được duyệt
 * Cập nhật: Kho hiện tại, Kho đích (nếu chuyển kho), Tổng tồn kho Variant, Tồn kho hiển thị Product.
 */
const handleStockChange = async (type, warehouse_id, items, receipt_id, user_id, dest_warehouse_id = null) => {
    // Ý nghĩa các loại giao dịch (type):
    // IMPORT (Nhập hàng): tăng kho hiện tại
    // EXPORT (Xuất hàng): giảm kho hiện tại
    // TRANSFER (Chuyển kho): giảm kho hiện tại, tăng kho đích
    // ADJUSTMENT (Điều chỉnh/Kiểm kê): cập nhật bằng số chênh lệch +/-

    for (const item of items) {
        const { variant_id, quantity, price } = item;
        
        // Tìm biến thể theo SKU hoặc ID
        const variant = await ProductVariantModel.findOne({ sku: variant_id }) || await ProductVariantModel.findOne({ id: variant_id });
        if (!variant) throw new Error(`Không tìm thấy variant: ${variant_id}`);

        // Lấy mức tồn kho hiện tại tại kho đang xét (warehouse_id)
        const currentWHStockIndex = variant.warehouse_stocks.findIndex(w => w.warehouse_id === warehouse_id);
        let beforeStock = currentWHStockIndex > -1 ? variant.warehouse_stocks[currentWHStockIndex].stock : 0;
        let afterStock = beforeStock;

        // Tính toán số lượng tồn kho mới tùy theo loại phiếu
        if (type === 'IMPORT' || type === 'RETURN') {
            afterStock = beforeStock + quantity;
        } else if (type === 'EXPORT') {
            if (beforeStock < quantity) throw new Error(`Tồn kho không đủ cho SKU: ${variant_id}`);
            afterStock = beforeStock - quantity;
        } else if (type === 'TRANSFER') {
            if (beforeStock < quantity) throw new Error(`Tồn kho không đủ cho SKU: ${variant_id} để chuyển`);
            afterStock = beforeStock - quantity;
        } else if (type === 'ADJUSTMENT') {
            afterStock = beforeStock + quantity; // quantity ở đây có thể là số âm
            if (afterStock < 0) throw new Error(`Điều chỉnh làm tồn kho âm cho SKU: ${variant_id}`);
        }

        // Cập nhật lại mảng phân bổ tồn kho theo kho (warehouse_stocks)
        if (currentWHStockIndex > -1) {
            variant.warehouse_stocks[currentWHStockIndex].stock = afterStock;
        } else {
            variant.warehouse_stocks.push({ warehouse_id, stock: afterStock });
        }

        // Cập nhật tổng tồn kho của biến thể (cho tất cả kho)
        const totalStockDiff = afterStock - beforeStock;
        variant.stock += totalStockDiff;
        await variant.save();

        // Đồng bộ tổng tồn kho mới lên Model Sản phẩm chính (hiển thị cho khách xem)
        const product = await ProductModel.findOne({ id: variant.product_id });
        if (product && product.variants) {
            const embedVar = product.variants.find(v => v.color === variant.color_id && v.size === variant.size_id);
            if (embedVar) {
                embedVar.stock = variant.stock;
                product.markModified('variants');
                await product.save();
            }
        }

        // Lưu Lịch sử giao dịch (Stock Transaction) cho kho nguồn
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

        // --- Nếu là chuyển kho (TRANSFER), xử lý cộng tồn cho kho đích ---
        if (type === 'TRANSFER' && dest_warehouse_id) {
            const destIndex = variant.warehouse_stocks.findIndex(w => w.warehouse_id === dest_warehouse_id);
            let destBefore = destIndex > -1 ? variant.warehouse_stocks[destIndex].stock : 0;
            let destAfter = destBefore + quantity; // Cộng số lượng vừa trừ ở kho nguồn
            
            if (destIndex > -1) {
                variant.warehouse_stocks[destIndex].stock = destAfter;
            } else {
                variant.warehouse_stocks.push({ warehouse_id: dest_warehouse_id, stock: destAfter });
            }
            await variant.save(); // Tổng stock không đổi

            // Lưu Stock Transaction nhập kho cho kho đích
            await new StockTransactionModel({
                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                type: 'IMPORT', // Kho đích sẽ coi đây là phiếu nhập
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

/**
 * @desc Lấy tất cả phiếu kho
 */
exports.getAll = async (req, res) => {
    try {
        const receipts = await StockReceiptModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: receipts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Tạo mới phiếu kho
 * Nếu status gửi lên là COMPLETED -> xử lý cập nhật kho luôn (handleStockChange).
 * Nếu DRAFT -> chỉ lưu nháp.
 */
exports.create = async (req, res) => {
    try {
        const { type, warehouse_id, dest_warehouse_id, supplier_id, reason, note, user_id, items, status } = req.body;
        
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });
        
        const receipt_id = `rec-${Math.random().toString(36).substr(2, 9)}`;

        const total_quantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);
        const total_amount = items.reduce((sum, item) => sum + (Math.abs(item.quantity) * (item.price || 0)), 0);

        const receiptStatus = status || 'DRAFT';

        const receipt = new StockReceiptModel({
            id: receipt_id,
            type, warehouse_id, dest_warehouse_id, supplier_id, reason, note, user_id, items,
            total_quantity, total_amount,
            status: receiptStatus
        });

        // Xử lý trừ/cộng tồn kho nếu tạo phiếu là duyệt ngay
        if (receiptStatus === 'COMPLETED') {
            await handleStockChange(type, warehouse_id, items, receipt_id, user_id, dest_warehouse_id);
        }

        await receipt.save();
        res.status(201).json({ success: true, data: receipt });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc Xem chi tiết phiếu kho
 */
exports.getById = async (req, res) => {
    try {
        const receipt = await StockReceiptModel.findOne({ id: req.params.id });
        if (!receipt) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kho' });
        res.json({ success: true, data: receipt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật phiếu kho (Chỉ khi đang ở trạng thái DRAFT/Nháp)
 */
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

/**
 * @desc Duyệt phiếu kho (Chuyển DRAFT -> COMPLETED và bắt đầu cộng/trừ kho)
 */
exports.approve = async (req, res) => {
    try {
        const { id } = req.params;
        const receipt = await StockReceiptModel.findOne({ id });
        
        if (!receipt) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kho' });
        
        if (receipt.status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: 'Phiếu đã được duyệt hoặc đã hủy' });
        }

        // Tiến hành ghi nhận tăng/giảm vào kho
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
