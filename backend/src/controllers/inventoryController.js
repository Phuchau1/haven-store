/**
 * ============================================================
 * CONTROLLER: QUẢN LÝ TỒN KHO (Inventory)
 * Mô tả: Xử lý logic xem lịch sử xuất/nhập kho, điều chỉnh số lượng
 *        thủ công, và cập nhật trực tiếp số lượng tồn kho của các biến thể.
 * ============================================================
 */
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

/**
 * @desc    Lấy lịch sử xuất/nhập kho
 * @route   GET /api/inventory/history
 * @access  Private/Admin
 */
const getInventoryHistory = async (req, res, next) => {
    try {
        const history = await InventoryHistoryModel.find().sort({ createdAt: -1 });
        
        // Nối thêm thông tin tên sản phẩm, mã SKU từ ProductVariant để hiển thị chi tiết
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
                // Xử lý fallback nếu không tìm thấy variant trong DB
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

/**
 * @desc    Điều chỉnh số lượng kho (Thêm hoặc bớt số lượng)
 * @route   POST /api/inventory/adjust
 * @access  Private/Admin
 */
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

        // 1. Cập nhật số lượng tồn kho lưu bên trong Product Model (Embedded variants)
        const product = await ProductModel.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        if (product.variants) {
            const variant = product.variants.find(v => v.color === color && v.size === size);
            if (variant) {
                const modifier = type === 'import' ? qtyValue : -qtyValue;
                variant.stock = Math.max(0, variant.stock + modifier); // Không cho âm kho
                await product.save();
            }
        }

        // 2. Cập nhật số lượng bên ProductVariant Model
        const modifier = type === 'import' ? qtyValue : -qtyValue;
        const pVariant = await ProductVariantModel.findOneAndUpdate(
            { product_id: productId, size_id: size, color_id: color },
            { $inc: { stock: modifier } },
            { new: true }
        );

        if (!pVariant) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể độc lập' });
        }

        // 3. Ghi log lịch sử thay đổi kho
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

/**
 * @desc    Cài đặt số lượng tồn kho trực tiếp (Set cố định một số)
 * @route   POST /api/inventory/set
 * @access  Private/Admin
 */
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

        // 1. Cập nhật embedded variants trong Product Model
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

        // 2. Cập nhật ProductVariant Model
        const pVariant = await ProductVariantModel.findOneAndUpdate(
            { product_id: productId, size_id: size, color_id: color },
            { stock: newStockVal },
            { new: true }
        );

        if (!pVariant) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể độc lập' });
        }

        // 3. Nếu số lượng thực sự thay đổi -> Tạo lịch sử xuất/nhập phần chênh lệch
        const difference = newStockVal - oldStock;
        if (difference !== 0) {
            const type = difference > 0 ? 'import' : 'export';
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant.id,
                type,
                quantity: Math.abs(difference), // Ghi nhận số lượng chênh lệch
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

/**
 * @desc    Lấy danh sách tồn kho hiện tại của tất cả các biến thể
 * @route   GET /api/inventory/stock
 * @access  Private/Admin
 */
const getStockList = async (req, res, next) => {
    try {
        const variants = await ProductVariantModel.find().lean();
        
        // Fetch thông tin tên sản phẩm để gộp vào chung data hiển thị
        const productIds = [...new Set(variants.map(v => v.product_id))];
        const products = await ProductModel.find({ id: { $in: productIds } }).lean();
        
        const productMap = {};
        products.forEach(p => productMap[p.id] = p);
        
        const stockList = variants.map(v => {
            const prod = productMap[v.product_id];
            // Nếu ảnh variant là placeholder hoặc không có, lấy ảnh thật của sản phẩm chính làm đại diện
            let imageUrl = v.image;
            if (!imageUrl || imageUrl === '/products/placeholder.jpg') {
                imageUrl = (prod && prod.images && prod.images.length > 0) ? prod.images[0] : '';
            }
            
            return {
                id: v.id,
                product_id: v.product_id,
                product_name: prod ? prod.name : 'Unknown',
                category: prod ? (prod.category_id || prod.category || 'N/A') : 'N/A',
                brand: prod ? (prod.brand || 'N/A') : 'N/A',
                sku: v.sku,
                barcode: v.barcode || '',
                qr_code: v.qr_code || '',
                size_id: v.size_id,
                color_id: v.color_id,
                price: v.price || (prod ? prod.price : 0),
                stock: v.stock,                                             // Tồn thực tế (vật lý trong kho)
                reserved_stock: v.reserved_stock || 0,                     // Đang giữ (khách đã đặt, chờ duyệt)
                available_stock: Math.max(0, v.stock - (v.reserved_stock || 0)), // Có thể bán (hiển thị website)
                status: v.status,
                image: imageUrl
            };
        });
        
        res.json({ success: true, data: stockList });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventoryHistory,
    adjustInventory,
    directSetStock,
    getStockList
};
