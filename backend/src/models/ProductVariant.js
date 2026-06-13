const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductVariantSchema = new Schema({
    id: { type: String, required: true, unique: true },
    product_id: { type: String, required: true },
    size_id: { type: String, required: true },
    color_id: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 }, // Tổng tồn kho (Storefront support)
    warehouse_stocks: [{
        warehouse_id: { type: String, required: true },
        stock: { type: Number, required: true, default: 0 }
    }],
    barcode: { type: String }, // Sinh barcode
    image: { type: String, required: true },
    price: { type: Number, required: true },
    sku: { type: String, required: true },
    status: { type: String, required: true, default: 'active' }
}, { timestamps: true });

ProductVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductVariantSchema.index({ barcode: 1 }, { sparse: true });

const ProductVariantModel = mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema);

module.exports = { ProductVariantModel };
