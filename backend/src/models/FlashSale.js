const mongoose = require('mongoose');

const FlashSaleVariantSchema = new mongoose.Schema({
    color: { type: String, required: true },
    size: { type: String, required: true },
    flashSalePrice: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    soldQuantity: { type: Number, default: 0 }
}, { _id: false });

const FlashSaleProductSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    flashSalePrice: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    soldQuantity: { type: Number, default: 0 },
    variants: [FlashSaleVariantSchema]
}, { _id: false });

FlashSaleProductSchema.virtual('productDoc', {
    ref: 'Product',
    localField: 'productId',
    foreignField: 'id',
    justOne: true
});

// Ensure virtuals are populated in subdocuments when requested
FlashSaleProductSchema.set('toJSON', { virtuals: true });
FlashSaleProductSchema.set('toObject', { virtuals: true });

const FlashSaleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    products: [FlashSaleProductSchema]
}, { timestamps: true });

// Virtual for calculating revenue
FlashSaleSchema.virtual('revenue').get(function() {
    if (!this.products) return 0;
    return this.products.reduce((total, p) => {
        let pTotal = 0;
        if (p.variants && p.variants.length > 0) {
            pTotal = p.variants.reduce((vTotal, v) => vTotal + (v.soldQuantity * v.flashSalePrice), 0);
        } else {
            pTotal = (p.soldQuantity * p.flashSalePrice);
        }
        return total + pTotal;
    }, 0);
});

// Virtual for calculating total items sold
FlashSaleSchema.virtual('totalSold').get(function() {
    if (!this.products) return 0;
    return this.products.reduce((total, p) => {
        if (p.variants && p.variants.length > 0) {
            return total + p.variants.reduce((vTotal, v) => vTotal + v.soldQuantity, 0);
        }
        return total + p.soldQuantity;
    }, 0);
});

// Virtual for calculating total stock
FlashSaleSchema.virtual('totalStock').get(function() {
    if (!this.products) return 0;
    return this.products.reduce((total, p) => total + p.stockQuantity, 0);
});

// Virtual for status (running, upcoming, ended)
FlashSaleSchema.virtual('status').get(function() {
    if (!this.isActive) return 'inactive';
    const now = new Date();
    if (now < this.startTime) return 'upcoming';
    if (now > this.endTime) return 'ended';
    return 'running';
});

// Ensure virtuals are included in JSON output
FlashSaleSchema.set('toJSON', { virtuals: true });
FlashSaleSchema.set('toObject', { virtuals: true });

const FlashSaleModel = mongoose.models.FlashSale || mongoose.model('FlashSale', FlashSaleSchema);

module.exports = { FlashSaleModel };
