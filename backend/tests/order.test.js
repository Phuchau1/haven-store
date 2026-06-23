const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');

// Khởi tạo app Express giả lập
const app = express();
app.use(express.json());

// Mock services trước khi require controller
jest.mock('../src/services/emailService', () => ({
    sendOrderConfirmationEmail: jest.fn()
}));
jest.mock('../src/services/queueService', () => ({
    enqueueOrderEmail: jest.fn()
}));

const { createOrder } = require('../src/controllers/orderController');
const { OrderModel } = require('../src/models/Order');
const { ProductModel } = require('../src/models/Product');
const { ProductVariantModel } = require('../src/models/ProductVariant');

app.post('/api/orders', createOrder);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
        instance: {
            // replicaSet is required for transactions
            replSet: 'rs0' 
        }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    await OrderModel.deleteMany({});
    await ProductModel.deleteMany({});
    await ProductVariantModel.deleteMany({});
});

describe('Order Controller', () => {
    it('Nên tạo đơn hàng thành công và giữ chỗ tồn kho', async () => {
        // Prepare mock product & variant
        await ProductModel.create({
            id: 'sp-1',
            name: 'Áo Thun',
            price: 100000,
            category: 'ao',
            categoryLabel: 'Áo',
            variants: [{ color: 'Đen', size: 'M', stock: 10 }]
        });

        await ProductVariantModel.create({
            id: 'v-1',
            product_id: 'sp-1',
            size_id: 'M',
            color_id: 'Đen',
            stock: 10,
            reserved_stock: 0,
            price: 100000,
            sku: 'SKU1',
            image: 'img.jpg'
        });

        const orderData = {
            customerName: 'Test User',
            phone: '0123456789',
            email: 'test@example.com',
            address: 'Hanoi',
            paymentMethod: 'cod',
            totalAmount: 100000,
            items: [{
                product: { id: 'sp-1', name: 'Áo Thun', price: 100000 },
                quantity: 2,
                selectedSize: 'M',
                selectedColor: { name: 'Đen', hex: '#000000' }
            }]
        };

        const response = await request(app).post('/api/orders').send(orderData);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.orderId).toBeDefined();

        // Check reserved stock
        const pVariant = await ProductVariantModel.findOne({ product_id: 'sp-1' });
        expect(pVariant.reserved_stock).toBe(2);
        expect(pVariant.stock).toBe(10); // Tổng tồn không đổi
    });

    it('Nên báo lỗi 400 khi đặt quá số lượng tồn kho khả dụng', async () => {
        await ProductVariantModel.create({
            id: 'v-2',
            product_id: 'sp-2',
            size_id: 'L',
            color_id: 'Trắng',
            stock: 5,
            reserved_stock: 4, // Chỉ còn dư 1
            price: 100000,
            sku: 'SKU2',
            image: 'img.jpg'
        });

        const orderData = {
            customerName: 'Test User',
            phone: '0123456789',
            email: 'test@example.com',
            address: 'Hanoi',
            paymentMethod: 'cod',
            totalAmount: 200000,
            items: [{
                product: { id: 'sp-2', name: 'Áo Sơ Mi', price: 100000 },
                quantity: 2, // Đặt 2 nhưng chỉ còn 1
                selectedSize: 'L',
                selectedColor: { name: 'Trắng', hex: '#ffffff' }
            }]
        };

        const response = await request(app).post('/api/orders').send(orderData);
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('không đủ hàng');
    });
});
