const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const { CategoryModel } = require('../src/models/Category');
const { BannerModel } = require('../src/models/Banner');
const { SizeModel } = require('../src/models/Size');
const { ColorModel } = require('../src/models/Color');
const { ShippingMethodModel } = require('../src/models/ShippingMethod');
const { PaymentMethodModel } = require('../src/models/PaymentMethod');
const { CouponModel } = require('../src/models/Coupon');
const { ProductModel } = require('../src/models/Product');
const { ProductVariantModel } = require('../src/models/ProductVariant');
const { UserModel } = require('../src/models/User');
const { OrderModel } = require('../src/models/Order');

const DATA_DIR = path.join(__dirname, '../data');

async function readData(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!await fs.pathExists(filePath)) {
        return [];
    }
    return await fs.readJSON(filePath);
}

function dbLog(msg) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Seed] ${msg}`);
}

async function runSeed() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';
    dbLog(`Connecting to MongoDB at: ${uri}...`);
    try {
        await mongoose.connect(uri);
        dbLog('Connected to MongoDB. Starting seed...');

        // 1. Seed Categories
        const catCount = await CategoryModel.countDocuments();
        if (catCount === 0) {
            dbLog('Categories collection is empty. Seeding categories...');
            const mockCategories = [
                { id: 'cat-clothing', name: 'Quần Áo', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=60' },
                { id: 'cat-shoes', name: 'Giày Dép', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60' },
                { id: 'cat-accessories', name: 'Phụ Kiện', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' }
            ];
            await CategoryModel.insertMany(mockCategories);
            dbLog(`Seeded ${mockCategories.length} categories.`);
        } else {
            dbLog('Categories already has data.');
        }

        // 2. Seed Banners
        const bannerCount = await BannerModel.countDocuments();
        if (bannerCount === 0) {
            dbLog('Banners collection is empty. Seeding banners...');
            const mockBanners = [
                {
                    id: 'banner-1',
                    title: 'BỘ SƯU TẬP MÙA HÈ 2026',
                    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&auto=format&fit=crop&q=80',
                    link: '/products?category=quan-ao',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'banner-2',
                    title: 'GIÀY THỂ THAO PHONG CÁCH',
                    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600&auto=format&fit=crop&q=80',
                    link: '/products?category=giay',
                    status: 'active',
                    created_at: new Date().toISOString()
                },
                {
                    id: 'banner-3',
                    title: 'PHỤ KIỆN THỜI TRANG CAO CẤP',
                    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1600&auto=format&fit=crop&q=80',
                    link: '/products?category=phu-kien',
                    status: 'active',
                    created_at: new Date().toISOString()
                }
            ];
            await BannerModel.insertMany(mockBanners);
            dbLog(`Seeded ${mockBanners.length} banners.`);
        } else {
            dbLog('Banners already has data.');
        }

        // 3. Seed Sizes
        const sizeCount = await SizeModel.countDocuments();
        if (sizeCount === 0) {
            dbLog('Sizes collection is empty. Seeding sizes...');
            const mockSizes = [
                { id: 'size-s', name: 'S' },
                { id: 'size-m', name: 'M' },
                { id: 'size-l', name: 'L' },
                { id: 'size-xl', name: 'XL' },
                { id: 'size-39', name: '39' },
                { id: 'size-40', name: '40' },
                { id: 'size-41', name: '41' },
                { id: 'size-42', name: '42' }
            ];
            await SizeModel.insertMany(mockSizes);
            dbLog(`Seeded ${mockSizes.length} sizes.`);
        } else {
            dbLog('Sizes already has data.');
        }

        // 4. Seed Colors
        const colorCount = await ColorModel.countDocuments();
        if (colorCount === 0) {
            dbLog('Colors collection is empty. Seeding colors...');
            const mockColors = [
                { id: 'color-black', name: 'Đen', code: '#000000' },
                { id: 'color-white', name: 'Trắng', code: '#ffffff' },
                { id: 'color-blue', name: 'Xanh Dương', code: '#1e3a8a' },
                { id: 'color-red', name: 'Đỏ', code: '#b91c1c' },
                { id: 'color-gray', name: 'Xám', code: '#6b7280' }
            ];
            await ColorModel.insertMany(mockColors);
            dbLog(`Seeded ${mockColors.length} colors.`);
        } else {
            dbLog('Colors already has data.');
        }

        // 5. Seed Shipping Methods
        const shipCount = await ShippingMethodModel.countDocuments();
        if (shipCount === 0) {
            dbLog('Shipping methods collection is empty. Seeding shipping methods...');
            const mockShipping = [
                { id: 'ship-standard', name_methond: 'Giao Hàng Tiêu Chuẩn', description: 'Nhận hàng sau 3 - 5 ngày làm việc (Phí: 20.000₫)', is_active: true },
                { id: 'ship-fast', name_methond: 'Giao Hàng Nhanh', description: 'Nhận hàng nhanh chóng trong 1 - 2 ngày (Phí: 35.000₫)', is_active: true }
            ];
            await ShippingMethodModel.insertMany(mockShipping);
            dbLog(`Seeded ${mockShipping.length} shipping methods.`);
        } else {
            dbLog('Shipping methods already has data.');
        }

        // 6. Seed Payment Methods
        const payCount = await PaymentMethodModel.countDocuments();
        if (payCount === 0) {
            dbLog('Payment methods collection is empty. Seeding payment methods...');
            const mockPayments = [
                { id: 'pay-cod', name_methond: 'Thanh Toán Khi Nhận Hàng (COD)', description: 'Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi.', is_active: true },
                { id: 'pay-bank', name_methond: 'Chuyển Khoản Ngân Hàng', description: 'Chuyển khoản trực tuyến nhanh chóng qua ứng dụng ngân hàng bằng quét mã QR.', is_active: true }
            ];
            await PaymentMethodModel.insertMany(mockPayments);
            dbLog(`Seeded ${mockPayments.length} payment methods.`);
        } else {
            dbLog('Payment methods already has data.');
        }

        // 7. Seed Coupons
        const couponCount = await CouponModel.countDocuments();
        if (couponCount === 0) {
            dbLog('Coupons collection is empty. Seeding coupons...');
            const mockCoupons = [
                { id: 'coupon-1', code: 'WELCOME50', discount_type: 'percent', discount_value: 50, start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 100 },
                { id: 'coupon-2', code: 'PHSTORE10', discount_type: 'percent', discount_value: 10, start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 500 },
                { id: 'coupon-3', code: 'FREESHIP', discount_type: 'fixed', discount_value: 35000, start_date: '2026-01-01', end_date: '2026-12-31', usage_limit: 200 }
            ];
            await CouponModel.insertMany(mockCoupons);
            dbLog(`Seeded ${mockCoupons.length} coupons.`);
        } else {
            dbLog('Coupons already has data.');
        }

        // 8. Seed Products
        const productCount = await ProductModel.countDocuments();
        let seededProducts = [];
        if (productCount === 0) {
            dbLog('Products collection is empty. Seeding from products.json...');
            const products = await readData('products.json');
            if (products && products.length > 0) {
                const mappedProducts = products.map(p => {
                    let category_id = 'cat-clothing';
                    if (p.category === 'giay') category_id = 'cat-shoes';
                    if (p.category === 'phu-kien') category_id = 'cat-accessories';
                    return {
                        ...p,
                        category_id
                    };
                });
                const res = await ProductModel.insertMany(mappedProducts);
                seededProducts = res;
                dbLog(`Seeded ${products.length} products to MongoDB successfully!`);
            } else {
                dbLog('No products found in products.json to seed.');
            }
        } else {
            dbLog(`Products collection already has ${productCount} items.`);
            seededProducts = await ProductModel.find();
        }

                // 9. Seed Product Variants
        const variantCount = await ProductVariantModel.countDocuments();
        if (variantCount === 0 && seededProducts.length > 0) {
            dbLog('Product variants collection is empty. Auto-generating variants for products...');
            const variantsToInsert = [];
            const addedVariantIds = new Set();
            const addedSkus = new Set();
            
            for (const prod of seededProducts) {
                const prodSizes = prod.sizes || ['M', 'L'];
                const prodColors = prod.colors || [{ name: 'Đen', hex: '#000000' }];
                
                let sizeIdsMapped = prodSizes.map(s => {
                    if (s.toLowerCase() === 's') return 'size-s';
                    if (s.toLowerCase() === 'm') return 'size-m';
                    if (s.toLowerCase() === 'l') return 'size-l';
                    if (s.toLowerCase() === 'xl') return 'size-xl';
                    return 'size-m';
                });
                
                if (prod.category === 'giay') {
                    sizeIdsMapped = prodSizes.map(s => `size-${s}`);
                }

                prodColors.forEach((color, cIdx) => {
                    let colorId = 'color-black';
                    if (color.name.includes('Trắng')) colorId = 'color-white';
                    else if (color.name.includes('Xanh')) colorId = 'color-blue';
                    else if (color.name.includes('Đỏ')) colorId = 'color-red';
                    else if (color.name.includes('Xám')) colorId = 'color-gray';

                    sizeIdsMapped.forEach((sizeId) => {
                        const variantId = `var-${prod.id}-${colorId}-${sizeId}`;
                        const sku = `${prod.id.toUpperCase()}-${colorId.replace('color-', '').substring(0,3).toUpperCase()}-${sizeId.replace('size-', '').toUpperCase()}`;
                        
                        if (!addedVariantIds.has(variantId) && !addedSkus.has(sku)) {
                            addedVariantIds.add(variantId);
                            addedSkus.add(sku);
                            variantsToInsert.push({
                                id: variantId,
                                product_id: prod.id,
                                size_id: sizeId,
                                color_id: colorId,
                                stock: Math.floor(Math.random() * 80) + 20,
                                image: prod.images[cIdx % prod.images.length] || prod.images[0],
                                price: prod.price,
                                sku: sku,
                                status: 'active'
                            });
                        }
                    });
                });
            }

            if (variantsToInsert.length > 0) {
                await ProductVariantModel.insertMany(variantsToInsert);
                dbLog(`Auto-seeded ${variantsToInsert.length} product variants successfully!`);
            }
        } else {
            dbLog(`Product variants collection already has ${variantCount} items.`);
        }

        // 10. Seed Users
        const userCount = await UserModel.countDocuments();
        if (userCount === 0) {
            dbLog('Users collection is empty. Seeding from users.json...');
            const users = await readData('users.json');
            if (users && users.length > 0) {
                await UserModel.insertMany(users);
                dbLog(`Seeded ${users.length} users to MongoDB successfully!`);
            } else {
                dbLog('No users found in users.json to seed.');
            }
        } else {
            dbLog(`Users collection already has ${userCount} items.`);
        }

        // 11. Seed Orders
        const orderCount = await OrderModel.countDocuments();
        if (orderCount === 0) {
            dbLog('Orders collection is empty. Seeding from orders.json...');
            const orders = await readData('orders.json');
            if (orders && orders.length > 0) {
                await OrderModel.insertMany(orders);
                dbLog(`Seeded ${orders.length} orders to MongoDB successfully!`);
            } else {
                dbLog('No orders found in orders.json to seed.');
            }
        } else {
            dbLog(`Orders collection already has ${orderCount} items.`);
        }

        dbLog('Database seeding completed successfully!');
    } catch (error) {
        dbLog(`Error while seeding database: ${error.message}`);
    } finally {
        await mongoose.connection.close();
        dbLog('Connection closed.');
        process.exit(0);
    }
}

runSeed();
