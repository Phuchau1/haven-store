/**
 * ============================================================
 * CONTROLLER: XUẤT FILE (Export - Excel/PDF)
 * Mô tả: Hỗ trợ xuất dữ liệu ra file Excel (xlsx) hoặc in PDF (pdfkit).
 *        Thường dùng cho các tính năng Báo cáo, In phiếu xuất/nhập kho.
 * ============================================================
 */
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const { StockReceiptModel } = require('../models/StockReceipt');
const { StockTransactionModel } = require('../models/StockTransaction');

/**
 * @desc Xuất danh sách Lịch sử giao dịch kho ra file Excel (.xlsx)
 * @route GET /api/export/transactions/excel
 */
exports.exportTransactionsExcel = async (req, res) => {
    try {
        const txns = await StockTransactionModel.find().sort({ createdAt: -1 }).lean();
        
        // Map dữ liệu thành định dạng Header - Value cho Excel
        const worksheetData = txns.map(t => ({
            'ID Giao Dịch': t.id,
            'Loại': t.type,
            'Mã Kho': t.warehouse_id,
            'Mã Sản Phẩm (SKU)': t.variant_id,
            'Số Lượng': t.quantity,
            'Tồn Trước': t.before_stock,
            'Tồn Sau': t.after_stock,
            'Ghi Chú': t.note || '',
            'Ngày Tạo': new Date(t.createdAt).toLocaleString('vi-VN') // Format theo giờ Việt Nam
        }));

        // Khởi tạo Workbook và Worksheet
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(wb, ws, "Lịch sử kho");

        // Ghi ra buffer để gửi về client tải xuống
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set Header trả về file đính kèm
        res.setHeader('Content-Disposition', 'attachment; filename="lich_su_kho.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc In phiếu xuất/nhập kho ra file PDF
 * @route GET /api/export/receipt/pdf?id=xxx
 */
exports.printReceiptPDF = async (req, res) => {
    try {
        const { id } = req.query;
        const receipt = await StockReceiptModel.findOne({ id }).lean();
        
        if (!receipt) return res.status(404).send('Không tìm thấy phiếu');

        // Khởi tạo PDFDocument với lề 50
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Disposition', `attachment; filename="phieu_${id}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        // Truyền luồng dữ liệu PDF trực tiếp thẳng về Client (Pipe)
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(`PHIẾU ${receipt.type}`, { align: 'center' });
        doc.moveDown();
        
        // Thông tin chung
        doc.fontSize(12).text(`Mã phiếu: ${receipt.id}`);
        doc.text(`Kho thao tác: ${receipt.warehouse_id}`);
        if (receipt.dest_warehouse_id) doc.text(`Kho đích: ${receipt.dest_warehouse_id}`);
        doc.text(`Ngày lập: ${new Date(receipt.createdAt).toLocaleString('vi-VN')}`);
        doc.text(`Người lập: ${receipt.user_id}`);
        doc.moveDown();

        // Danh sách sản phẩm (Items)
        doc.text('Chi tiết hàng hóa:');
        doc.moveDown(0.5);
        receipt.items.forEach((item, index) => {
            doc.text(`${index + 1}. SKU: ${item.variant_id} | SL: ${item.quantity} | Giá: ${item.price || 0}`);
        });

        doc.moveDown();
        doc.text(`Tổng số lượng: ${receipt.total_quantity}`);
        
        // Kết thúc và đóng luồng
        doc.end();

    } catch (error) {
        res.status(500).send(error.message);
    }
};
