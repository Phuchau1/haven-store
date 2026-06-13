const { FlashSaleModel } = require('../models/FlashSale');
const { ProductModel } = require('../models/Product');

const getActiveFlashSale = async (req, res) => {
    try {
        const now = new Date();
        const activeFlashSale = await FlashSaleModel.findOne({
            isActive: true,
            startTime: { $lte: now },
            endTime: { $gt: now }
        }).populate('products.productDoc');

        if (!activeFlashSale) {
            return res.json({ success: true, data: null });
        }

        // Format data for frontend (similar to what it expects now)
        // Frontend expects list of products with flashSalePrice
        const products = activeFlashSale.products
            .map(fp => {
                const p = fp.productDoc;
                if (!p) return null;
                // Avoid modifying the actual product document
                const pObj = p.toObject ? p.toObject() : p;
                pObj.price = fp.flashSalePrice; 
                pObj.originalPrice = p.price; // the old price
                pObj.flashSaleSold = fp.soldQuantity;
                pObj.flashSaleStock = fp.stockQuantity;
                pObj.discountPercentage = Math.round((1 - fp.flashSalePrice / p.price) * 100);
                pObj.flashSaleVariants = fp.variants || []; // Add variants info
                return pObj;
            })
            .filter(Boolean);

        return res.json({
            success: true,
            data: {
                id: activeFlashSale._id,
                name: activeFlashSale.name,
                endTime: activeFlashSale.endTime,
                products: products
            }
        });
    } catch (error) {
        console.error("getActiveFlashSale error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getAdminFlashSales = async (req, res) => {
    try {
        const flashSales = await FlashSaleModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: flashSales });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createFlashSale = async (req, res) => {
    try {
        const { name, startTime, endTime, isActive, products } = req.body;
        
        // Validate products
        if (products && products.length > 0) {
            for (let p of products) {
                const prod = await ProductModel.findOne({ id: p.productId });
                if (!prod) {
                    return res.status(400).json({ success: false, message: `Product ${p.productId} not found` });
                }
            }
        }

        const newFlashSale = new FlashSaleModel({
            name, startTime, endTime, isActive, products
        });
        await newFlashSale.save();
        res.json({ success: true, data: newFlashSale });
    } catch (error) {
        console.error("createFlashSale error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime, isActive, products } = req.body;
        
        // Validate products
        if (products && products.length > 0) {
            for (let p of products) {
                const prod = await ProductModel.findOne({ id: p.productId });
                if (!prod) {
                    return res.status(400).json({ success: false, message: `Product ${p.productId} not found` });
                }
            }
        }

        const updated = await FlashSaleModel.findByIdAndUpdate(
            id,
            { name, startTime, endTime, isActive, products },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Flash sale not found' });
        }
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await FlashSaleModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Flash sale not found' });
        }
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getFlashSaleDashboard = async (req, res) => {
    try {
        const flashSales = await FlashSaleModel.find().populate('products.productDoc');
        const now = new Date();
        
        let totalActive = 0;
        let totalRevenue = 0;
        let totalSold = 0;
        let upcomingOrEndingSoon = [];
        let productStats = {}; // { productId: { name, totalSold, revenue } }

        for (let fs of flashSales) {
            if (fs.isActive && fs.startTime <= now && fs.endTime > now) {
                totalActive++;
            }
            
            // Check ending soon (within 24 hours)
            if (fs.isActive && fs.endTime > now && (fs.endTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000)) {
                upcomingOrEndingSoon.push({
                    id: fs._id,
                    name: fs.name,
                    endTime: fs.endTime,
                    status: 'ending_soon'
                });
            }

            totalRevenue += fs.revenue;
            totalSold += fs.totalSold;

            // Calculate top products
            for (let p of fs.products) {
                let pSold = 0;
                let pRev = 0;

                if (p.variants && p.variants.length > 0) {
                    pSold = p.variants.reduce((total, v) => total + v.soldQuantity, 0);
                    pRev = p.variants.reduce((total, v) => total + (v.soldQuantity * v.flashSalePrice), 0);
                } else {
                    pSold = p.soldQuantity;
                    pRev = p.soldQuantity * p.flashSalePrice;
                }

                if (pSold > 0 && p.productDoc) {
                    const pid = p.productDoc.id;
                    const pName = p.productDoc.name;
                    
                    if (!productStats[pid]) {
                        productStats[pid] = { id: pid, name: pName, sold: 0, revenue: 0 };
                    }
                    productStats[pid].sold += pSold;
                    productStats[pid].revenue += pRev;
                }
            }
        }

        upcomingOrEndingSoon.sort((a, b) => a.endTime - b.endTime);

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);

        res.json({
            success: true,
            data: {
                totalActive,
                totalRevenue,
                totalSold,
                endingSoon: upcomingOrEndingSoon.slice(0, 5),
                topProducts
            }
        });

    } catch (error) {
        console.error("getFlashSaleDashboard error:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getActiveFlashSale,
    getAdminFlashSales,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    getFlashSaleDashboard
};
