const { PurchaseOrderModel } = require('../models/PurchaseOrder');
const { StockReceiptModel } = require('../models/StockReceipt');
const stockReceiptController = require('./stockReceiptController');

exports.getAll = async (req, res) => {
    try {
        const pos = await PurchaseOrderModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { supplier_id, warehouse_id, expected_date, items, note, user_id } = req.body;
        
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });
        
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
        
        // Tự động sinh phiếu nhập kho khi Received
        if (status === 'RECEIVED') {
            // Giả lập req, res cho stockReceiptController.create
            const mockReq = {
                body: {
                    type: 'IMPORT',
                    warehouse_id: po.warehouse_id,
                    supplier_id: po.supplier_id,
                    reason: `Nhập kho từ Đơn Mua Hàng ${po.id}`,
                    note: po.note,
                    user_id: user_id || po.user_id,
                    items: po.items,
                    po_id: po.id
                }
            };
            
            const mockRes = {
                status: (code) => ({
                    json: (data) => {
                        if (!data.success) throw new Error(data.message);
                    }
                })
            };
            
            await stockReceiptController.create(mockReq, mockRes);
        }
        
        res.json({ success: true, data: po, message: status === 'RECEIVED' ? 'Cập nhật thành công và đã tự tạo Phiếu Nhập Kho' : 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
