/**
 * ============================================================
 * CONTROLLER: MÃ VẠCH (Barcode)
 * Mô tả: Sinh ảnh mã vạch (Barcode PNG) và tìm kiếm thông tin
 *        sản phẩm/biến thể dựa trên mã vạch hoặc SKU được quét.
 * ============================================================
 */
const bwipjs = require('bwip-js'); // Thư viện tạo ảnh Barcode/QR
const { ProductVariantModel } = require('../models/ProductVariant');

/**
 * @desc Sinh ra một hình ảnh mã vạch (Barcode loại Code128) dựa trên chuỗi text
 * @route GET /api/barcode/generate?text=xxx
 * @return Trả về dạng file ảnh (image/png) trực tiếp thay vì JSON
 */
exports.generateBarcode = async (req, res) => {
    try {
        const { text } = req.query;
        if (!text) return res.status(400).send('Thiếu mã barcode');

        // Tạo Buffer hình ảnh mã vạch từ text
        bwipjs.toBuffer({
            bcid: 'code128',       // Loại mã vạch phổ biến
            text: text,            // Đoạn text cần mã hóa
            scale: 3,              // Tỷ lệ phóng to
            height: 10,            // Chiều cao mã
            includetext: true,     // Hiển thị chữ bên dưới mã vạch
            textxalign: 'center',  // Canh giữa chữ
        }, function (err, png) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.setHeader('Content-Type', 'image/png'); // Trả về dạng ảnh
                res.send(png);
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

/**
 * @desc API dùng cho máy quét mã vạch (Máy quét sẽ gửi chuỗi quét được lên đây)
 * @route GET /api/barcode/scan?barcode=xxx
 */
exports.findByBarcode = async (req, res) => {
    try {
        const { barcode } = req.query;
        
        // 1. Thử tìm theo trường barcode trước
        const variant = await ProductVariantModel.findOne({ barcode });
        
        if (!variant) {
            // 2. Nếu không có barcode, thử tìm theo SKU (Vì nhiều nơi dùng SKU làm mã vạch luôn)
            const variantBySku = await ProductVariantModel.findOne({ sku: barcode });
            if (!variantBySku) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            return res.json({ success: true, data: variantBySku });
        }
        
        res.json({ success: true, data: variant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
