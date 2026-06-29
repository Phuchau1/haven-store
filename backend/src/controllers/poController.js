/**
 * ============================================================
 * CONTROLLER: ĐƠN MUA HÀNG (Purchase Order - PO)
 * Mô tả: Quản lý nghiệp vụ đặt hàng từ nhà cung cấp (Supplier).
 * Khi trạng thái PO chuyển sang 'RECEIVED' (Đã nhận hàng), 
 * hệ thống sẽ TỰ ĐỘNG sinh ra một Phiếu Nhập Kho (Stock Receipt).
 * ============================================================
 */
const { PurchaseOrderModel } = require('../models/PurchaseOrder');
const { StockReceiptModel } = require('../models/StockReceipt');
const stockReceiptController = require('./stockReceiptController');

/**
 * @desc Lấy danh sách tất cả các Đơn mua hàng (PO)
 */
exports.getAll = async (req, res) => {
    try {
        const pos = await PurchaseOrderModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Tạo một Đơn mua hàng mới (Gửi cho Supplier)
 */
exports.create = async (req, res) => {
    try {
        const { supplier_id, warehouse_id, expected_date, items, note, user_id } = req.body;
        
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });
        
        // Tính tổng số tiền của đơn hàng
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        const po = new PurchaseOrderModel({
            id: `po-${Math.random().toString(36).substr(2, 9)}`,
            supplier_id, warehouse_id, expected_date, items, note, user_id, total_amount
        });
        
        await po.save();
        res.status(201).json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc Cập nhật trạng thái của Đơn mua hàng
 * QUAN TRỌNG: Nếu trạng thái là 'RECEIVED' -> Gọi StockReceiptController để tự tạo phiếu nhập kho
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.query;
        const { status, user_id } = req.body;
        
        const po = await PurchaseOrderModel.findOne({ id });
        if (!po) return res.status(404).json({ success: false, message: 'Không tìm thấy PO' });
        
        if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Không thể đổi trạng thái của PO đã nhận hoặc hủy' });
        }
        
        po.status = status;
        await po.save();
        
        // --- LOGIC TỰ ĐỘNG HÓA ---
        // Tự động sinh phiếu nhập kho (Stock Receipt) khi Đơn mua hàng chuyển sang 'Đã nhận'
        if (status === 'RECEIVED') {
            // Giả lập đối tượng req, res để tái sử dụng lại hàm create() của stockReceiptController
            const mockReq = {
                body: {
                    type: 'IMPORT', // Loại phiếu là Nhập kho
                    warehouse_id: po.warehouse_id,
                    supplier_id: po.supplier_id,
                    reason: `Nhập kho từ Đơn Mua Hàng ${po.id}`, // Lý do tự động
                    note: po.note,
                    user_id: user_id || po.user_id,
                    items: po.items, // Lấy toàn bộ hàng hóa từ PO
                    po_id: po.id
                }
            };
            
            // Bắt lỗi nếu tạo phiếu nhập thất bại
            const mockRes = {
                status: (code) => ({
                    json: (data) => {
                        if (!data.success) throw new Error(data.message);
                    }
                })
            };
            
            // Gọi chéo controller để tạo phiếu
            await stockReceiptController.create(mockReq, mockRes);
        }
        
        res.json({ 
            success: true, 
            data: po, 
            message: status === 'RECEIVED' ? 'Cập nhật thành công và đã tự tạo Phiếu Nhập Kho Nháp' : 'Cập nhật trạng thái thành công' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
