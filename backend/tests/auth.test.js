const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');

const app = express();
app.use(express.json());

const { register, login } = require('../src/controllers/authController');
const { UserModel } = require('../src/models/User');

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

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
    await UserModel.deleteMany({});
});

describe('Auth Controller Tests', () => {
    it('Đăng ký tài khoản mới thành công', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Nguyen Van A',
            email: 'nva@example.com',
            password: 'password123',
            phone: '0987654321'
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('nva@example.com');
        expect(res.body.user.password).toBeUndefined(); // Đảm bảo không trả password
    });

    it('Không cho đăng ký trùng email', async () => {
        await UserModel.create({
            id: 'usr-test',
            name: 'Existing User',
            email: 'nva@example.com',
            password: 'hashedpassword'
        });

        const res = await request(app).post('/api/auth/register').send({
            name: 'Nguyen Van A',
            email: 'nva@example.com',
            password: 'password123'
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Email đã được đăng ký');
    });

    it('Đăng nhập thành công với mật khẩu đúng', async () => {
        const crypto = require('crypto');
        const hashedPassword = crypto.createHash('sha256').update('password123').digest('hex');

        await UserModel.create({
            id: 'usr-1',
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword
        });

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'password123'
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.id).toBe('usr-1');
    });

    it('Từ chối đăng nhập với sai mật khẩu', async () => {
        const crypto = require('crypto');
        const hashedPassword = crypto.createHash('sha256').update('password123').digest('hex');

        await UserModel.create({
            id: 'usr-1',
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword
        });

        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'wrongpassword'
        });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
