const { InventoryHistoryModel } = require('../models/InventoryHistory');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [InventoryController] ${msg}\n`);
    console.log(`[InventoryController] ${msg}`);
}

const getInventoryHistory = async (req, res, next) => {
    try {
        const history = await InventoryHistoryModel.find().sort({ createdAt: -1 });
        
        const detailedHistory = [];
        for (const item of history) {
            const doc = item.toObject();
            
            const pVariant = await ProductVariantModel.findOne({ id: doc.variant_id });
            if (pVariant) {
                const product = await ProductModel.findOne({ id: pVariant.product_id });
                doc.productName = product ? product.name : 'Sản phẩm đã xóa';
                doc.productId = pVariant.product_id;
                doc.color = pVariant.color_id;
                doc.size = pVariant.size_id;
                doc.sku = pVariant.sku;
            } else {
                const parts = doc.variant_id.split('-');
                doc.productName = `Mã biến thể: ${doc.variant_id}`;
                doc.productId = parts.slice(1, -2).join('-');
                doc.color = parts[parts.length - 2] || 'N/A';
                doc.size = parts[parts.length - 1] || 'N/A';
                doc.sku = 'N/A';
            }
            detailedHistory.push(doc);
        }

        res.json({ success: true, history: detailedHistory });
    } catch (error) {
        next(error);
    }
};

const adjustInventory = async (req, res, next) => {
    try {
        const { productId, color, size, type, quantity, note } = req.body;

        if (!productId || !color || !size || !type || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin điều chỉnh kho bắt buộc' });
        }

        if (!['import', 'export'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Loại điều chỉnh không hợp lệ' });
        }

        const qtyValue = Number(quantity);
        if (isNaN(qtyValue) || qtyValue <= 0) {
            return res.status(400).json({ success: false, message: 'Số lượng phải là số lớn hơn 0' });
        }

        // 1. Update Product Model embedded variants
        const product = await ProductModel.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        if (product.variants) {
            const variant = product.variants.find(v => v.color === color && v.size === size);
            if (variant) {
                const modifier = type === 'import' ? qtyValue : -qtyValue;
                variant.stock = Math.max(0, variant.stock + modifier);
                await product.save();
            }
        }

        // 2. Update ProductVariant Model
        const modifier = type === 'import' ? qtyValue : -qtyValue;
        const pVariant = await ProductVariantModel.findOneAndUpdate(
            { product_id: productId, size_id: size, color_id: color },
            { $inc: { stock: modifier } },
            { new: true }
        );

        if (!pVariant) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể độc lập' });
        }

        // 3. Create inventory log
        const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
        const invLog = new InventoryHistoryModel({
            id: logId,
            variant_id: pVariant.id,
            type,
            quantity: qtyValue,
            note: note || `Điều chỉnh kho thủ công (${type === 'import' ? 'Nhập' : 'Xuất'})`,
            created_at: new Date().toISOString()
        });
        await invLog.save();

        log(`Manual adjustment successful: ${type} ${qtyValue} for variant ${pVariant.id}`);
        res.json({ success: true, message: 'Điều chỉnh kho thành công', variant: pVariant });
    } catch (error) {
        next(error);
    }
};

const directSetStock = async (req, res, next) => {
    try {
        const { productId, color, size, stock, note } = req.body;

        if (!productId || !color || !size || stock === undefined) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin cập nhật kho bắt buộc' });
        }

        const newStockVal = Number(stock);
        if (isNaN(newStockVal) || newStockVal < 0) {
            return res.status(400).json({ success: false, message: 'Số lượng kho mới không hợp lệ' });
        }

        // 1. Update Product Model embedded variants
        const product = await ProductModel.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        let oldStock = 0;
        if (product.variants) {
            const variant = product.variants.find(v => v.color === color && v.size === size);
            if (variant) {
                oldStock = variant.stock;
                variant.stock = newStockVal;
                await product.save();
            }
        }

        // 2. Update ProductVariant Model
        const pVariant = await ProductVariantModel.findOneAndUpdate(
            { product_id: productId, size_id: size, color_id: color },
            { stock: newStockVal },
            { new: true }
        );

        if (!pVariant) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể độc lập' });
        }

        // 3. Create inventory history log if there is a difference
        const difference = newStockVal - oldStock;
        if (difference !== 0) {
            const type = difference > 0 ? 'import' : 'export';
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant.id,
                type,
                quantity: Math.abs(difference),
                note: note || `Thay đổi số lượng trực tiếp từ ${oldStock} thành ${newStockVal}`,
                created_at: new Date().toISOString()
            });
            await invLog.save();
        }

        log(`Direct stock update successful: Set ${newStockVal} (previously ${oldStock}) for variant ${pVariant.id}`);
        res.json({ success: true, message: 'Cập nhật số lượng kho thành công', variant: pVariant });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventoryHistory,
    adjustInventory,
    directSetStock
};
