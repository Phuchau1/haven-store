const mongoose = require('mongoose');
const { WarehouseModel } = require('./models/Warehouse');
const { SupplierModel } = require('./models/Supplier');
const { PurchaseOrderModel } = require('./models/PurchaseOrder');
const { StockReceiptModel } = require('./models/StockReceipt');
const { StockTransactionModel } = require('./models/StockTransaction');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';

async function seedWMS() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Clear existing WMS data (optional, but good for a fresh start)
        await WarehouseModel.deleteMany({});
        await SupplierModel.deleteMany({});
        await PurchaseOrderModel.deleteMany({});
        await StockReceiptModel.deleteMany({});
        // Not clearing StockTransaction to keep existing history, just testing new data

        // Seed Warehouses
        const wh1 = new WarehouseModel({ id: 'wh-hn', code: 'WH-HN', name: 'Kho Tổng Hà Nội', address: '123 Cầu Giấy, Hà Nội' });
        const wh2 = new WarehouseModel({ id: 'wh-hcm', code: 'WH-HCM', name: 'Kho Tổng HCM', address: '456 Quận 1, TP.HCM' });
        await wh1.save();
        await wh2.save();

        // Seed Suppliers
        const sup1 = new SupplierModel({ id: 'sup-zara', name: 'Zara VN Distribution', email: 'contact@zara.vn', phone: '0987654321', tax_code: '0123456789' });
        const sup2 = new SupplierModel({ id: 'sup-local', name: 'Xưởng May Gia Công HN', email: 'xuongmay@gmail.com', phone: '0912345678', tax_code: '9876543210' });
        await sup1.save();
        await sup2.save();

        // Seed Purchase Orders
        const po1 = new PurchaseOrderModel({
            id: 'po-1001',
            supplier_id: sup1.id,
            warehouse_id: wh1.id,
            expected_date: '2026-06-15',
            total_amount: 15000000,
            status: 'PENDING',
            user_id: 'admin',
            items: [{ variant_id: 'LF-X0XAJG-M', quantity: 50, price: 300000 }]
        });
        
        const po2 = new PurchaseOrderModel({
            id: 'po-1002',
            supplier_id: sup2.id,
            warehouse_id: wh2.id,
            expected_date: '2026-06-10',
            total_amount: 8000000,
            status: 'APPROVED',
            user_id: 'admin',
            items: [{ variant_id: 'ao-blazer-01-L', quantity: 20, price: 400000 }]
        });
        await po1.save();
        await po2.save();

        // Seed Stock Receipts
        const rec1 = new StockReceiptModel({
            id: 'rec-2001',
            type: 'IMPORT',
            warehouse_id: wh1.id,
            supplier_id: sup1.id,
            reason: 'Nhập hàng đợt 1',
            total_quantity: 100,
            total_amount: 30000000,
            status: 'COMPLETED',
            user_id: 'admin',
            items: [{ variant_id: 'LF-X0XAJG-S', quantity: 100, price: 300000 }]
        });

        const rec2 = new StockReceiptModel({
            id: 'rec-2002',
            type: 'TRANSFER',
            warehouse_id: wh1.id,
            dest_warehouse_id: wh2.id,
            reason: 'Chuyển hàng vào Nam',
            total_quantity: 50,
            status: 'COMPLETED',
            user_id: 'admin',
            items: [{ variant_id: 'LF-X0XAJG-S', quantity: 50 }]
        });
        await rec1.save();
        await rec2.save();

        console.log('Seed WMS success');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedWMS();
