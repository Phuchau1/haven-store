const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const { StockReceiptModel } = require('../models/StockReceipt');
const { StockTransactionModel } = require('../models/StockTransaction');

exports.exportTransactionsExcel = async (req, res) => {
    try {
        const txns = await StockTransactionModel.find().sort({ createdAt: -1 }).lean();
        
        const worksheetData = txns.map(t => ({
            'ID Giao Dịch': t.id,
            'Loại': t.type,
            'Mã Kho': t.warehouse_id,
            'Mã Sản Phẩm (SKU)': t.variant_id,
            'Số Lượng': t.quantity,
            'Tồn Trước': t.before_stock,
            'Tồn Sau': t.after_stock,
            'Ghi Chú': t.note || '',
            'Ngày Tạo': new Date(t.createdAt).toLocaleString('vi-VN')
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(wb, ws, "Lịch sử kho");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="lich_su_kho.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.printReceiptPDF = async (req, res) => {
    try {
        const { id } = req.query;
        const receipt = await StockReceiptModel.findOne({ id }).lean();
        
        if (!receipt) return res.status(404).send('Không tìm thấy phiếu');

        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Disposition', `attachment; filename="phieu_${id}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(`PHIẾU ${receipt.type}`, { align: 'center' });
        doc.moveDown();
        
        // Info
        doc.fontSize(12).text(`Mã phiếu: ${receipt.id}`);
        doc.text(`Kho thao tác: ${receipt.warehouse_id}`);
        if (receipt.dest_warehouse_id) doc.text(`Kho đích: ${receipt.dest_warehouse_id}`);
        doc.text(`Ngày lập: ${new Date(receipt.createdAt).toLocaleString('vi-VN')}`);
        doc.text(`Người lập: ${receipt.user_id}`);
        doc.moveDown();

        // Items
        doc.text('Chi tiết hàng hóa:');
        doc.moveDown(0.5);
        receipt.items.forEach((item, index) => {
            doc.text(`${index + 1}. SKU: ${item.variant_id} | SL: ${item.quantity} | Giá: ${item.price || 0}`);
        });

        doc.moveDown();
        doc.text(`Tổng số lượng: ${receipt.total_quantity}`);
        
        doc.end();

    } catch (error) {
        res.status(500).send(error.message);
    }
};
