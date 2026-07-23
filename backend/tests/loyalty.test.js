const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');

const app = express();
app.use(express.json());

const { getMyPoints, redeemPoints } = require('../src/controllers/loyaltyController');
const { LoyaltyPointsModel } = require('../src/models/LoyaltyPoints');
const { LoyaltyTransactionModel } = require('../src/models/LoyaltyTransaction');

// Mock protect middleware
app.use((req, res, next) => {
    req.user = { id: req.headers['x-user-id'] || 'user-123', role: 'user' };
    next();
});

app.get('/api/loyalty/me', getMyPoints);
app.post('/api/loyalty/redeem', redeemPoints);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
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
    await LoyaltyPointsModel.deleteMany({});
    await LoyaltyTransactionModel.deleteMany({});
});

describe('Loyalty Points Controller Tests', () => {
    it('Lấy thông tin điểm và phân cấp thành viên thành công', async () => {
        await LoyaltyPointsModel.create({
            userId: 'user-123',
            points: 1200,
            totalEarned: 1500,
            level: 'Silver'
        });

        const res = await request(app)
            .get('/api/loyalty/me')
            .set('x-user-id', 'user-123');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.loyalty.points).toBe(1200);
        expect(res.body.loyalty.level).toBe('Silver');
        expect(res.body.loyalty.nextLevel).toBe('Gold');
    });

    it('Đổi điểm thành công khi đủ điểm', async () => {
        await LoyaltyPointsModel.create({
            userId: 'user-123',
            points: 500,
            totalEarned: 500,
            level: 'Bronze'
        });

        const res = await request(app)
            .post('/api/loyalty/redeem')
            .set('x-user-id', 'user-123')
            .send({
                userId: 'user-123',
                pointsToRedeem: 200
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.remainingPoints).toBe(300);
        expect(res.body.voucherValue).toBe(20000);
    });

    it('Báo lỗi khi số điểm không đủ để đổi', async () => {
        await LoyaltyPointsModel.create({
            userId: 'user-123',
            points: 50,
            totalEarned: 50,
            level: 'Bronze'
        });

        const res = await request(app)
            .post('/api/loyalty/redeem')
            .set('x-user-id', 'user-123')
            .send({
                userId: 'user-123',
                pointsToRedeem: 100
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
