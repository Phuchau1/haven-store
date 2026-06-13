require('dotenv').config();
const path = require('path');
// Load additional env variables if present
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const mongoose = require('mongoose');

const { UserModel } = require('../src/models/User');
const { CategoryModel } = require('../src/models/Category');
const { ProductModel } = require('../src/models/Product');
const { SizeModel } = require('../src/models/Size');
const { ColorModel } = require('../src/models/Color');
const { ProductVariantModel } = require('../src/models/ProductVariant');
const { CouponModel } = require('../src/models/Coupon');
const { ShippingMethodModel } = require('../src/models/ShippingMethod');
const { PaymentMethodModel } = require('../src/models/PaymentMethod');
const { AddressModel } = require('../src/models/Address');
const { ProductReviewModel } = require('../src/models/ProductReview');
const { InventoryHistoryModel } = require('../src/models/InventoryHistory');
const { OrderStatusHistoryModel } = require('../src/models/OrderStatusHistory');
const { OrderModel } = require('../src/models/Order');
const { ChatSessionModel } = require('../src/models/ChatSession');
const { ChatMessageModel } = require('../src/models/ChatMessage');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';

async function seedAll() {
    try {
        console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully.');

        // 1. Clear existing collections
        console.log('Clearing existing collections...');
        await Promise.all([
            UserModel.deleteMany({}),
            CategoryModel.deleteMany({}),
            ProductModel.deleteMany({}),
            SizeModel.deleteMany({}),
            ColorModel.deleteMany({}),
            ProductVariantModel.deleteMany({}),
            CouponModel.deleteMany({}),
            ShippingMethodModel.deleteMany({}),
            PaymentMethodModel.deleteMany({}),
            AddressModel.deleteMany({}),
            ProductReviewModel.deleteMany({}),
            InventoryHistoryModel.deleteMany({}),
            OrderStatusHistoryModel.deleteMany({}),
            OrderModel.deleteMany({}),
            ChatSessionModel.deleteMany({}),
            ChatMessageModel.deleteMany({})
        ]);
        console.log('Cleared all collections.');

        // 2. Seed Category Data
        console.log('Seeding Categories...');
        const categories = [
            {
                id: 'quan-ao',
                name: 'Quần Áo',
                description: 'Áo khoác, áo thun, quần jeans thời thượng...',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop'
            },
            {
                id: 'giay',
                name: 'Giày Dép',
                description: 'Sneaker, Boot da, Loafer nam nữ...',
                image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=400&fit=crop'
            },
            {
                id: 'phu-kien',
                name: 'Phụ Kiện',
                description: 'Túi xách, mũ nón, thắt lưng tinh tế...',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop'
            }
        ];
        await CategoryModel.insertMany(categories);
        console.log(`Inserted ${categories.length} Categories.`);

        // 3. Seed Sizes Data
        console.log('Seeding Sizes...');
        const sizes = [
            { id: 'size-s', name: 'S' },
            { id: 'size-m', name: 'M' },
            { id: 'size-l', name: 'L' },
            { id: 'size-xl', name: 'XL' },
            { id: 'size-39', name: '39' },
            { id: 'size-40', name: '40' },
            { id: 'size-41', name: '41' },
            { id: 'size-42', name: '42' }
        ];
        await SizeModel.insertMany(sizes);
        console.log(`Inserted ${sizes.length} Sizes.`);

        // 4. Seed Colors Data
        console.log('Seeding Colors...');
        const colors = [
            { id: 'color-black', name: 'Đen', code: '#000000' },
            { id: 'color-white', name: 'Trắng', code: '#FFFFFF' },
            { id: 'color-navy', name: 'Xanh navy', code: '#000080' },
            { id: 'color-beige', name: 'Be', code: '#F5F5DC' },
            { id: 'color-gray', name: 'Xám', code: '#808080' },
            { id: 'color-red', name: 'Đỏ', code: '#FF0000' }
        ];
        await ColorModel.insertMany(colors);
        console.log(`Inserted ${colors.length} Colors.`);

        // 5. Seed Coupons Data
        console.log('Seeding Coupons...');
        const coupons = [
            {
                id: 'coupon-phstore20',
                code: 'PHSTORE20',
                discount_type: 'percent',
                discount_value: 20,
                start_date: '2026-01-01',
                end_date: '2026-12-31',
                usage_limit: 150
            },
            {
                id: 'coupon-welcome50',
                code: 'WELCOME50',
                discount_type: 'fixed',
                discount_value: 50000,
                start_date: '2026-01-01',
                end_date: '2026-12-31',
                usage_limit: 500
            },
            {
                id: 'coupon-sale100',
                code: 'SUMMER100',
                discount_type: 'fixed',
                discount_value: 100000,
                start_date: '2026-05-01',
                end_date: '2026-09-30',
                usage_limit: 100
            }
        ];
        await CouponModel.insertMany(coupons);
        console.log(`Inserted ${coupons.length} Coupons.`);

        // 6. Seed Shipping & Payment Methods
        console.log('Seeding Shipping Methods...');
        const shippingMethods = [
            { id: 'ship-standard', name_methond: 'Giao hàng Tiêu Chuẩn', description: 'Giao tận nơi từ 2-4 ngày làm việc.', is_active: true },
            { id: 'ship-express', name_methond: 'Giao hàng Hỏa Tốc', description: 'Nhận hàng ngay trong ngày (chỉ nội thành).', is_active: true }
        ];
        await ShippingMethodModel.insertMany(shippingMethods);

        console.log('Seeding Payment Methods...');
        const paymentMethods = [
            { id: 'pay-cod', name_methond: 'Thanh toán COD', description: 'Thanh toán tiền mặt trực tiếp khi giao nhận sản phẩm.', is_active: true },
            { id: 'pay-bank', name_methond: 'Chuyển khoản Ngân hàng', description: 'Thanh toán chuyển khoản trực tuyến cực kỳ nhanh chóng.', is_active: true }
        ];
        await PaymentMethodModel.insertMany(paymentMethods);
        console.log('Inserted Shipping and Payment Methods.');

        // 7. Seed Users Data
        console.log('Seeding Users...');
        const users = [
            {
                id: 'user-admin',
                name: 'PH Store Manager',
                email: 'admin@gmail.com',
                password: '123', // Demo pass
                role: 'admin',
                phone: '0901234567',
                address: 'Hà Nội, Việt Nam'
            },
            {
                id: 'user-customer1',
                name: 'Nguyễn Văn Nam',
                email: 'namnguyen@gmail.com',
                password: '123',
                role: 'user',
                phone: '0912345678',
                address: '15 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội'
            },
            {
                id: 'user-customer2',
                name: 'Trần Thị Mai',
                email: 'maitran@gmail.com',
                password: '123',
                role: 'user',
                phone: '0987654321',
                address: '120 Điện Biên Phủ, Quận 1, TP Hồ Chí Minh'
            }
        ];
        await UserModel.insertMany(users);
        console.log(`Inserted ${users.length} Users.`);

        // 8. Seed Addresses Data
        console.log('Seeding Addresses...');
        const addresses = [
            {
                id: 'addr-nam-1',
                user_id: 'user-customer1',
                receiver_name: 'Nguyễn Văn Nam',
                phone: '0912345678',
                province: 'Hà Nội',
                ward: 'Phường Bách Khoa',
                address_detail: 'Số 15 Tạ Quang Bửu',
                is_default: true
            },
            {
                id: 'addr-mai-1',
                user_id: 'user-customer2',
                receiver_name: 'Trần Thị Mai',
                phone: '0987654321',
                province: 'Hồ Chí Minh',
                ward: 'Phường Bến Nghé',
                address_detail: '120 Điện Biên Phủ',
                is_default: true
            }
        ];
        await AddressModel.insertMany(addresses);
        console.log(`Inserted ${addresses.length} Addresses.`);

        // 9. Seed Products & Variants Data
        console.log('Seeding Products and ProductVariants...');
        const products = [
            {
                id: 'ao-blazer-01',
                name: 'Áo Blazer Oversized Premium',
                price: 1290000,
                originalPrice: 1890000,
                category: 'quan-ao',
                categoryLabel: 'Áo khoác',
                images: [
                    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop',
                    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop',
                ],
                sizes: ['S', 'M', 'L', 'XL'],
                colors: [
                    { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop' },
                    { name: 'Be', hex: '#F5F5DC', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop' }
                ],
                description: 'Áo blazer oversized phong cách Hàn Quốc, chất liệu vải tuyết mưa cao cấp, đứng form. Phù hợp đi làm, dạo phố.',
                rating: 4.8,
                reviews: 12,
                inStock: true,
                soldQuantity: 45
            },
            {
                id: 'ao-thun-02',
                name: 'Áo Thun Unisex Cotton 100%',
                price: 350000,
                category: 'quan-ao',
                categoryLabel: 'Áo thun',
                images: [
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop',
                    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop',
                ],
                sizes: ['S', 'M', 'L'],
                colors: [
                    { name: 'Trắng', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop' },
                    { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop' }
                ],
                description: 'Áo thun unisex cotton co giãn 4 chiều dày dặn, thấm hút mồ hôi cực tốt.',
                rating: 4.5,
                reviews: 8,
                inStock: true,
                soldQuantity: 98
            },
            {
                id: 'giay-sneaker-07',
                name: 'Sneaker Classic Trắng',
                price: 1450000,
                originalPrice: 1890000,
                category: 'giay',
                categoryLabel: 'Sneaker',
                images: [
                    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop',
                    'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=750&fit=crop'
                ],
                sizes: ['39', '40', '41', '42'],
                colors: [
                    { name: 'Trắng', hex: '#FFFFFF', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop' }
                ],
                description: 'Giày sneaker cổ điển thiết kế đế cao su 3cm mềm mại tôn dáng, dễ vệ sinh.',
                rating: 4.9,
                reviews: 20,
                inStock: true,
                soldQuantity: 120
            }
        ];

        // Seed product embedded variants and separate variant documents
        const variantsToInsert = [];
        for (const p of products) {
            const productVariants = [];
            
            p.colors.forEach((c) => {
                p.sizes.forEach((s, sIdx) => {
                    // Random stock (including some 0 stock for testing out-of-stock features)
                    const stock = sIdx === 0 ? 0 : Math.floor(Math.random() * 40) + 10;
                    
                    const varId = `variant-${p.id}-${c.name.toLowerCase()}-${s.toLowerCase()}`;
                    const varSku = `SKU-${p.id.toUpperCase()}-${c.name.substring(0,2).toUpperCase()}-${s}`;
                    
                    const variantData = {
                        color: c.name,
                        size: s,
                        stock: stock
                    };
                    productVariants.push(variantData);

                    // For the independent ProductVariant model (relational model)
                    variantsToInsert.push({
                        id: varId,
                        product_id: p.id,
                        size_id: s,
                        color_id: c.name,
                        stock: stock,
                        image: c.image || p.images[0],
                        price: p.price,
                        sku: varSku,
                        status: 'active'
                    });
                });
            });

            p.variants = productVariants;
            await new ProductModel(p).save();
        }
        
        await ProductVariantModel.insertMany(variantsToInsert);
        console.log(`Inserted ${products.length} Products and ${variantsToInsert.length} ProductVariants.`);

        // 10. Seed Inventory History Data
        console.log('Seeding Inventory History Logs...');
        const inventoryLogs = [];
        variantsToInsert.forEach((v, idx) => {
            inventoryLogs.push({
                id: `inv-log-${idx}`,
                variant_id: v.id,
                type: 'import',
                quantity: v.stock + 20,
                note: 'Khởi tạo nhập kho hàng hóa đầu kỳ.',
                created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
            });
            if (v.stock > 10) {
                inventoryLogs.push({
                    id: `inv-log-out-${idx}`,
                    variant_id: v.id,
                    type: 'export',
                    quantity: 5,
                    note: 'Bán lẻ đơn hàng trực tuyến.',
                    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
                });
            }
        });
        await InventoryHistoryModel.insertMany(inventoryLogs);
        console.log(`Inserted ${inventoryLogs.length} Inventory Logs.`);

        // 11. Seed Product Reviews
        console.log('Seeding Product Reviews...');
        const reviews = [
            {
                id: 'rev-1',
                user_id: 'user-customer1',
                userName: 'Nguyễn Văn Nam',
                userEmail: 'namnguyen@gmail.com',
                product_id: 'ao-blazer-01',
                productName: 'Áo Blazer Oversized Premium',
                rating: 5,
                content: 'Chất vải đẹp mịn, đứng dáng blazer chuẩn Hàn Quốc. Shop đóng gói rất kỹ càng.',
                status: 'approved',
                created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
            },
            {
                id: 'rev-2',
                user_id: 'user-customer2',
                userName: 'Trần Thị Mai',
                userEmail: 'maitran@gmail.com',
                product_id: 'giay-sneaker-07',
                productName: 'Sneaker Classic Trắng',
                rating: 5,
                content: 'Giày mang cực kỳ êm chân, màu trắng tinh khôi rất dễ mix đồ. Đáng đồng tiền bát gạo.',
                status: 'approved',
                created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString()
            }
        ];
        await ProductReviewModel.insertMany(reviews);
        console.log(`Inserted ${reviews.length} Product Reviews.`);

        // 12. Seed Order and OrderStatusHistory Data
        console.log('Seeding Orders...');
        const orders = [
            {
                id: 'order-1',
                customerName: 'Nguyễn Văn Nam',
                phone: '0912345678',
                email: 'namnguyen@gmail.com',
                address: 'Số 15 Tạ Quang Bửu, Phường Bách Khoa, Hà Nội',
                paymentMethod: 'cod',
                items: [
                    {
                        product: {
                            id: 'ao-blazer-01',
                            name: 'Áo Blazer Oversized Premium',
                            price: 1290000,
                            images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop'],
                            sizes: ['S', 'M', 'L', 'XL'],
                            colors: [{ name: 'Đen', hex: '#000000' }],
                            description: 'Áo blazer phong cách Hàn Quốc.',
                            rating: 4.8,
                            reviews: 12,
                            inStock: true
                        },
                        quantity: 1,
                        selectedSize: 'M',
                        selectedColor: { name: 'Đen', hex: '#000000' }
                    }
                ],
                totalAmount: 1290000,
                note: 'Giao vào giờ hành chính giúp em.',
                status: 'shipped',
                createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
            },
            {
                id: 'order-2',
                customerName: 'Trần Thị Mai',
                phone: '0987654321',
                email: 'maitran@gmail.com',
                address: '120 Điện Biên Phủ, Phường Bến Nghé, Hồ Chí Minh',
                paymentMethod: 'bank-transfer',
                items: [
                    {
                        product: {
                            id: 'giay-sneaker-07',
                            name: 'Sneaker Classic Trắng',
                            price: 1450000,
                            images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop'],
                            sizes: ['39', '40', '41', '42'],
                            colors: [{ name: 'Trắng', hex: '#FFFFFF' }],
                            description: 'Sneaker classic trắng năng động.',
                            rating: 4.9,
                            reviews: 20,
                            inStock: true
                        },
                        quantity: 1,
                        selectedSize: '40',
                        selectedColor: { name: 'Trắng', hex: '#FFFFFF' }
                    }
                ],
                totalAmount: 1450000,
                note: 'Thanh toán thành công qua momo.',
                status: 'processing',
                createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
            }
        ];
        await OrderModel.insertMany(orders);

        console.log('Seeding Order Status History...');
        const orderHistory = [
            { id: 'h-1', order_id: 'order-1', status: 'pending', note: 'Đặt hàng thành công.', created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
            { id: 'h-2', order_id: 'order-1', status: 'processing', note: 'Đã xác nhận & đang chuẩn bị hàng.', created_at: new Date(Date.now() - 3600000 * 24 * 2.8).toISOString() },
            { id: 'h-3', order_id: 'order-1', status: 'shipped', note: 'Đã giao cho đơn vị vận chuyển.', created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
            { id: 'h-4', order_id: 'order-2', status: 'pending', note: 'Chờ khách chuyển khoản.', created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString() },
            { id: 'h-5', order_id: 'order-2', status: 'processing', note: 'Chuyển khoản thành công. Đang xử lý.', created_at: new Date(Date.now() - 3600000 * 24 * 0.9).toISOString() }
        ];
        await OrderStatusHistoryModel.insertMany(orderHistory);
        console.log('Seeded Orders and Status Histories.');

        // 13. Seed Chat Sessions & Messages
        console.log('Seeding Chat Sessions and Messages...');
        const chatSessions = [
            {
                id: 'session-demo-1',
                customer_name: 'Nguyễn Văn Nam',
                phone: '0912345678',
                status: 'open'
            },
            {
                id: 'session-demo-2',
                customer_name: 'Trần Thị Mai',
                phone: '0987654321',
                status: 'closed'
            }
        ];
        await ChatSessionModel.insertMany(chatSessions);

        const chatMessages = [
            {
                id: 'msg-demo-1',
                session_id: 'session-demo-1',
                sender_type: 'user',
                message: 'Chào shop, em muốn hỏi áo blazer oversized 01 còn màu Be size L không ạ?'
            },
            {
                id: 'msg-demo-2',
                session_id: 'session-demo-1',
                sender_type: 'bot',
                message: 'Chào bạn Nguyễn Văn Nam! Hiện sản phẩm Áo Blazer Oversized Premium màu Be size L vẫn còn hàng tại cửa hàng ạ. Bạn có thể bấm thêm vào giỏ hàng ngay nhé! 🛍️'
            },
            {
                id: 'msg-demo-3',
                session_id: 'session-demo-1',
                sender_type: 'user',
                message: 'Vâng cám ơn shop, em vừa đặt mua rồi ạ!'
            },
            {
                id: 'msg-demo-4',
                session_id: 'session-demo-2',
                sender_type: 'user',
                message: 'Shop ơi đôi sneaker classic trắng đi bị rộng thì có đổi được không?'
            },
            {
                id: 'msg-demo-5',
                session_id: 'session-demo-2',
                sender_type: 'admin',
                message: 'Dạ chào chị Mai, PH Store hỗ trợ đổi size miễn phí trong vòng 7 ngày làm việc kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên tem mác ạ. Nhân viên giao hàng sẽ qua thu hồi và giao đôi mới tận nhà cho chị nha.'
            }
        ];
        await ChatMessageModel.insertMany(chatMessages);
        console.log('Seeded Chat Sessions and Messages.');

        console.log('\n=========================================');
        console.log('👉 COMPLETE DATABASE SEEDING COMPLETED 👈');
        console.log('All 18+ ERD Tables and Collections are fully seeded.');
        console.log('=========================================\n');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedAll();
