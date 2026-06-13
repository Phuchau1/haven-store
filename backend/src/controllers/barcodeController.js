const bwipjs = require('bwip-js');
const { ProductVariantModel } = require('../models/ProductVariant');

exports.generateBarcode = async (req, res) => {
    try {
        const { text } = req.query;
        if (!text) return res.status(400).send('Thiếu mã barcode');

        bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center',
        }, function (err, png) {
            if (err) {
                res.status(500).send(err.message);
            } else {
                res.setHeader('Content-Type', 'image/png');
                res.send(png);
            }
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.findByBarcode = async (req, res) => {
    try {
        const { barcode } = req.query;
        const variant = await ProductVariantModel.findOne({ barcode });
        
        if (!variant) {
            // Thử tìm theo sku nếu barcode không có
            const variantBySku = await ProductVariantModel.findOne({ sku: barcode });
            if (!variantBySku) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            return res.json({ success: true, data: variantBySku });
        }
        
        res.json({ success: true, data: variant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
