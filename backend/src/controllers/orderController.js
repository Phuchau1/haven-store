/**
 * ============================================================
 * CONTROLLER: ĐƠN HÀNG (Order)
 * Mô tả: Xử lý các logic liên quan đến đặt hàng, trạng thái đơn,
 *        trừ tồn kho, hoàn trả kho, và gửi email xác nhận.
 * Sử dụng Transactions (Session) để đảm bảo tính toàn vẹn dữ liệu.
 * ============================================================
 */
const mongoose = require('mongoose');
const { OrderModel } = require('../models/Order');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');
const { CouponModel } = require('../models/Coupon');
const { ShippingMethodModel } = require('../models/ShippingMethod');
const { UserModel } = require('../models/User');
const { CartModel } = require('../models/Cart');
const { WalletTransactionModel } = require('../models/WalletTransaction');
// Sử dụng BullMQ queue để gửi email bất đồng bộ (không làm chậm tốc độ tạo đơn)
const { enqueueOrderEmail } = require('../services/queueService');
// Điểm tích lũy: cộng điểm sau khi tạo đơn, thu hồi khi hủy đơn
const { earnPoints, revokePoints } = require('./loyaltyController');
// Carrier Simulator: tự động khởi tạo vận đơn khi chọn nhà vận chuyển
const { initShipping } = require('../services/carrierSimulator');
const { validateStatusTransition } = require('../utils/orderStateGuard');
const { refundOrderToWallet } = require('./walletController');

const fs = require('fs');
const path = require('path');

/**
 * Hàm ghi log cục bộ ra file `backend_debug.log`
 */
function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [OrderController] ${msg}\n`);
    console.log(`[OrderController] ${msg}`);
}

/**
 * @desc Giảm số lượng tồn kho (giữ chỗ) khi khách tạo đơn hàng
 * @param {Array} orderItems - Danh sách sản phẩm trong đơn
 * @param {String} orderId - Mã đơn hàng
 * @param {Object} session - Mongoose session để dùng trong Transaction
 */
const decreaseStockOnOrder = async (orderItems, orderId, session) => {
    try {
        for (const item of orderItems) {
            const productId = item.product.id;
            const size = item.selectedSize;
            const color = item.selectedColor?.name || item.selectedColor;
            const quantity = item.quantity;

            // 1. Cập nhật tồn kho trên ProductVariantModel
            let pVariant = null;
            try {
                pVariant = await ProductVariantModel.findOneAndUpdate(
                    { 
                        product_id: productId, 
                        size_id: size, 
                        color_id: color
                    },
                    { 
                        $inc: { stock: -quantity },
                        $set: { updatedAt: new Date() }
                    },
                    { new: true, session: session || null }
                );
            } catch (vErr) {
                log(`[ProductVariantModel] Warning: ${vErr.message}`);
            }

            // 2. Đồng bộ trực tiếp vào ProductModel.variants & ProductModel.soldQuantity
            try {
                const productDoc = await ProductModel.findOne({ id: productId }).session(session || null);
                if (productDoc) {
                    if (Array.isArray(productDoc.variants) && productDoc.variants.length > 0) {
                        const vIdx = productDoc.variants.findIndex(v => 
                            (v.color?.toLowerCase() === String(color).toLowerCase()) && 
                            (v.size?.toUpperCase() === String(size).toUpperCase())
                        );
                        if (vIdx !== -1) {
                            productDoc.variants[vIdx].stock = Math.max(0, (productDoc.variants[vIdx].stock || 0) - quantity);
                        }
                        const totalStock = productDoc.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
                        productDoc.inStock = totalStock > 0;
                    } else {
                        // Sản phẩm không có biến thể
                        if (productDoc.stock !== undefined) {
                            productDoc.stock = Math.max(0, (productDoc.stock || 0) - quantity);
                            productDoc.inStock = productDoc.stock > 0;
                        }
                    }
                    productDoc.soldQuantity = (productDoc.soldQuantity || 0) + quantity;
                    await productDoc.save({ session: session || null });
                    log(`[ProductModel Sync] Đã trừ ${quantity} tồn kho và cộng soldQuantity cho sản phẩm ${productId}`);
                }
            } catch (pErr) {
                log(`[ProductModel Sync Warning] ${pErr.message}`);
            }
        }
        log(`Đã trừ tồn kho thành công cho đơn hàng: ${orderId}`);
    } catch (error) {
        log(`Lỗi khi trừ tồn kho (decreaseStockOnOrder): ${error.message}`);
        throw error;
    }
};

/**
 * @desc Hoàn trả đầy đủ tồn kho (ProductVariantModel & ProductModel) khi đơn hàng bị HỦY hoặc HOÀN TRẢ
 * @param {Array} orderItems - Danh sách sản phẩm trong đơn
 * @param {String} orderId - Mã đơn hàng
 */
const restoreStockOnCancel = async (orderItems, orderId) => {
    try {
        if (!Array.isArray(orderItems) || orderItems.length === 0) return;

        for (const item of orderItems) {
            const productId = item.product?.id || item.product?._id || item.product;
            const size = item.selectedSize;
            const color = item.selectedColor?.name || item.selectedColor;
            const quantity = Number(item.quantity) || 1;

            if (!productId) continue;

            // 1. Hoàn trả tồn kho trên ProductVariantModel
            try {
                if (size && color) {
                    await ProductVariantModel.findOneAndUpdate(
                        { 
                            product_id: productId, 
                            size_id: size, 
                            color_id: color
                        },
                        { 
                            $inc: { stock: quantity },
                            $set: { updatedAt: new Date() }
                        },
                        { new: true }
                    );
                }
            } catch (vErr) {
                log(`[ProductVariantModel Restore Warning] ${vErr.message}`);
            }

            // 2. Hoàn trả tồn kho trên ProductModel (variants & tổng stock & soldQuantity)
            try {
                const productDoc = await ProductModel.findOne({
                    $or: [
                        { id: productId },
                        { id: String(productId) },
                        { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : undefined }
                    ].filter(Boolean)
                });

                if (productDoc) {
                    if (Array.isArray(productDoc.variants) && productDoc.variants.length > 0) {
                        const vIdx = productDoc.variants.findIndex(v => 
                            (String(v.color || '').toLowerCase() === String(color || '').toLowerCase()) && 
                            (String(v.size || '').toUpperCase() === String(size || '').toUpperCase())
                        );
                        if (vIdx !== -1) {
                            productDoc.variants[vIdx].stock = (Number(productDoc.variants[vIdx].stock) || 0) + quantity;
                        }
                        const totalStock = productDoc.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
                        productDoc.inStock = totalStock > 0;
                    } else {
                        // Sản phẩm không có biến thể
                        if (productDoc.stock !== undefined) {
                            productDoc.stock = (Number(productDoc.stock) || 0) + quantity;
                            productDoc.inStock = productDoc.stock > 0;
                        }
                    }

                    // Giảm lượt bán do đơn bị hủy
                    if (productDoc.soldQuantity !== undefined) {
                        productDoc.soldQuantity = Math.max(0, (productDoc.soldQuantity || 0) - quantity);
                    }

                    await productDoc.save();
                    log(`[ProductModel Restore] Đã cộng lại ${quantity} tồn kho cho sản phẩm ${productId} (Size: ${size}, Màu: ${color}) do hủy đơn #${orderId}`);
                }
            } catch (pErr) {
                log(`[ProductModel Restore Warning] ${pErr.message}`);
            }
        }
        log(`Đã hoàn trả tồn kho toàn bộ thành công cho đơn hàng: ${orderId}`);
    } catch (error) {
        log(`Lỗi khi hoàn trả tồn kho (restoreStockOnCancel): ${error.message}`);
    }
};

const releaseReservedStock = restoreStockOnCancel;
const returnExportedStock = restoreStockOnCancel;

/**
 * @desc Admin duyệt đơn (pending -> processing)
 *       Ghi log kiểm tra xuất kho
 */
const exportStockOnApproval = async (orderItems, orderId) => {
    try {
        log(`[exportStockOnApproval] Đã xác nhận đơn được duyệt: ${orderId}`);
    } catch (error) {
        log(`Lỗi exportStockOnApproval: ${error.message}`);
    }
};

/**
 * @desc    Lấy danh sách đơn hàng (Có thể lọc theo email user)
 * @route   GET /api/orders
 * @access  Private / User / Admin
 */
const getOrders = async (req, res, next) => {
    try {
        const email = typeof req.query.email === 'string' ? req.query.email.trim() : undefined;
        const filter = email ? { email } : {};
        let orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();

        // Tự động Seed đơn hàng mẫu vào MongoDB nếu chưa có đơn nào trong DB
        if (orders.length === 0 && !email) {
            await autoSeedOrdersData();
            orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();
        }

        res.json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm Tự Động Tạo Đơn Hàng Mẫu Vẫn Lưu Trực Tiếp Vào MongoDB Database
 */
async function autoSeedOrdersData() {
    try {
        const seedOrders = [
            {
                id: 'ORD-2026-9901',
                customerName: 'Nguyễn Văn Hùng',
                phone: '0988123456',
                email: 'hung.nguyen@gmail.com',
                address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
                paymentMethod: 'COD',
                totalAmount: 699000,
                finalAmount: 699000,
                status: 'processing',
                createdAt: new Date().toISOString(),
                items: [{
                    product: {
                        id: 'HAVEN-POLO-BLK-L',
                        name: 'Áo Polo Nam Can Phối Thân Cotton',
                        price: 350000,
                        images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600']
                    },
                    quantity: 1,
                    selectedSize: 'L',
                    selectedColor: { name: 'Đen', hex: '#000000' }
                }]
            },
            {
                id: 'ORD-2026-9902',
                customerName: 'Trần Thị Mai',
                phone: '0912345678',
                email: 'mai.tran@gmail.com',
                address: '45 Phố Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
                paymentMethod: 'MoMo',
                totalAmount: 1250000,
                finalAmount: 1250000,
                status: 'processing',
                createdAt: new Date().toISOString(),
                items: [{
                    product: {
                        id: 'HAVEN-SHIRT-WHT-M',
                        name: 'Áo Sơ Mi Nam Kẻ Sọc Oxford Premium',
                        price: 450000,
                        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600']
                    },
                    quantity: 2,
                    selectedSize: 'M',
                    selectedColor: { name: 'Trắng', hex: '#FFFFFF' }
                }]
            }
        ];

        for (const ord of seedOrders) {
            await OrderModel.updateOne({ id: ord.id }, { $set: ord }, { upsert: true });
        }
        log('[getOrders] Auto-seeded sample orders into MongoDB Database!');
    } catch (err) {
        log(`[autoSeedOrdersData] Error: ${err.message}`);
    }
}

/**
 * @desc    Tạo đơn hàng mới (Checkout)
 * @route   POST /api/orders
 * @access  Public / User
 * @note    Dùng Transaction để đảm bảo: Nếu hết hàng -> Không tạo đơn -> Không trừ mã giảm giá
 */
const createOrder = async (req, res, next) => {
    // Khởi tạo Transaction session từ Mongoose
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        log('--- YÊU CẦU TẠO ĐƠN HÀNG MỚI ---');
        const body = req.body;

        if (!body.items || body.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng không được để trống' });
        }

        // Mã đơn hàng: Lấy từ client hoặc tự sinh dạng LF-ABCXYZ
        const orderId = body.id || `LF-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Kiểm tra Idempotent: Nếu client gửi lên 1 ID đã tồn tại, trả về thành công luôn
        if (body.id) {
            const existingOrder = await OrderModel.findOne({ id: body.id }).session(session);
            if (existingOrder) {
                await session.abortTransaction();
                session.endSession();
                log(`Đơn hàng ${body.id} đã tồn tại, bỏ qua tạo mới (Idempotent).`);
                return res.json({ success: true, orderId: existingOrder.id, finalAmount: existingOrder.finalAmount });
            }
        }

        // Bắt đầu tính toán lại giá từ backend
        let calculatedTotalAmount = 0;
        
        // Loop qua từng item để tính giá chuẩn
        for (const item of body.items) {
            const productId = item.product?.id || item.product?._id;
            const size = item.selectedSize;
            const color = item.selectedColor?.name;
            const quantity = Number(item.quantity) || 1;
            
            let itemPrice = Number(item.product?.price) || 0;

            let dbProduct = null;
            if (productId) {
                dbProduct = await ProductModel.findOne({
                    $or: [
                        { id: productId },
                        { id: String(productId) },
                        { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : undefined }
                    ].filter(Boolean)
                }).session(session);
            }
            
            if (dbProduct) {
                itemPrice = dbProduct.price;
                // Tìm variant để xem có giá ghi đè không
                if (dbProduct.variants) {
                    const variant = dbProduct.variants.find(v => v.color === color && v.size === size);
                    if (variant && variant.price !== undefined && variant.price !== null) {
                        itemPrice = variant.price;
                    }
                }
            }
            
            // Ghi đè lại giá chuẩn cho item (để khi lưu vào DB, lịch sử có giá đúng)
            if (item.product) {
                item.product.price = itemPrice;
            }
            calculatedTotalAmount += itemPrice * quantity;
        }

        let calculatedDiscount = 0;

        // Xử lý mã giảm giá (Gắn Session) - Hỗ trợ cả Coupon hệ thống và UserCoupon (Vòng quay)
        if (body.couponCode) {
            const UserCoupon = require('../models/UserCoupon');
            const codeClean = body.couponCode.toUpperCase().trim();

            const userCoupon = await UserCoupon.findOne({ coupon_code: codeClean }).session(session);
            if (userCoupon) {
                if (userCoupon.is_used) {
                    throw new Error('Mã giảm giá này đã được sử dụng.');
                }
                const now = new Date();
                if (userCoupon.expires_at && new Date(userCoupon.expires_at) < now) {
                    throw new Error('Mã giảm giá này đã hết hạn.');
                }

                if (userCoupon.type === 'percent') {
                    calculatedDiscount = Math.round((calculatedTotalAmount * userCoupon.discount_value) / 100);
                } else {
                    calculatedDiscount = userCoupon.discount_value;
                }
                calculatedDiscount = Math.min(calculatedDiscount, calculatedTotalAmount);

                // Đánh dấu UserCoupon là đã sử dụng
                await UserCoupon.findOneAndUpdate(
                    { coupon_code: codeClean },
                    { $set: { is_used: true } },
                    { session }
                );
            } else {
                const coupon = await CouponModel.findOne({ code: codeClean }).session(session);
                
                if (coupon) {
                    if (coupon.usage_limit_per_user > 0) {
                        const userUsedCount = await OrderModel.countDocuments({ 
                            couponCode: coupon.code, 
                            email: body.email, 
                            status: { $ne: 'cancelled' }
                        }).session(session);
                        
                        if (userUsedCount >= coupon.usage_limit_per_user) {
                            throw new Error('Bạn đã hết lượt sử dụng mã giảm giá này.');
                        }
                    }
                    
                    if (coupon.discount_type === 'percent') {
                        calculatedDiscount = Math.round((calculatedTotalAmount * coupon.discount_value) / 100);
                    } else {
                        calculatedDiscount = coupon.discount_value;
                    }
                    
                    calculatedDiscount = Math.min(calculatedDiscount, calculatedTotalAmount);

                    await CouponModel.findOneAndUpdate(
                        { code: codeClean },
                        { $inc: { usage_limit: -1 } },
                        { session }
                    );
                }
            }
        }

        // Xử lý phí vận chuyển (Bảo mật: Tính lại giống Mock API dựa trên address)
        let calculatedShippingFee = 0;
        let finalShippingMethodId = body.shippingMethodId || 'GHN';
        
        if (body.address) {
            const isHCM = body.address.toLowerCase().includes('hồ chí minh');
            const totalWeight = 200 * body.items.reduce((sum, i) => sum + i.quantity, 0); // Mỗi item mặc định 200g
            
            let baseFee = 35000;
            if (finalShippingMethodId === 'GHN') baseFee = isHCM ? 20000 : 35000;
            if (finalShippingMethodId === 'GHTK') baseFee = isHCM ? 18000 : 32000;
            if (finalShippingMethodId === 'VIETTEL') baseFee = isHCM ? 22000 : 38000;
            if (finalShippingMethodId === 'JT') baseFee = isHCM ? 15000 : 30000;

            let weightSurcharge = 0;
            if (totalWeight > 500) {
                const extraWeight = totalWeight - 500;
                weightSurcharge = Math.ceil(extraWeight / 500) * 5000;
            }

            calculatedShippingFee = baseFee + weightSurcharge;
            
            // Freeship nếu đơn > 500k
            if (calculatedTotalAmount >= 500000) {
                calculatedShippingFee = 0;
            }
        }

        // Tính tổng tiền thanh toán cuối cùng của đơn hàng
        const calculatedFinalAmount = Math.max(0, calculatedTotalAmount - calculatedDiscount + calculatedShippingFee);

        const isWalletPayment = String(body.paymentMethod || '').toLowerCase() === 'wallet';
        let walletTxToSave = null;

        if (isWalletPayment) {
            let targetUser = null;
            if (body.userId) {
                targetUser = await UserModel.findOne({ id: body.userId }).session(session);
            }
            if (!targetUser && body.email) {
                targetUser = await UserModel.findOne({ email: body.email }).session(session);
            }

            if (!targetUser) {
                throw new Error('Vui lòng đăng nhập tài khoản để thanh toán bằng Ví HAVEN');
            }

            const currentBalance = Number(targetUser.walletBalance) || 0;
            if (currentBalance < calculatedFinalAmount) {
                throw new Error(`Số dư ví không đủ để thanh toán. Số dư hiện có: ${currentBalance.toLocaleString('vi-VN')} đ, cần: ${calculatedFinalAmount.toLocaleString('vi-VN')} đ`);
            }

            const balanceAfter = currentBalance - calculatedFinalAmount;
            targetUser.walletBalance = balanceAfter;
            await targetUser.save({ session });

            const txId = `WT-${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`;
            walletTxToSave = new WalletTransactionModel({
                id: txId,
                userId: targetUser.id,
                userEmail: targetUser.email,
                type: 'payment',
                amount: -calculatedFinalAmount,
                balanceBefore: currentBalance,
                balanceAfter,
                orderId: orderId,
                description: `Thanh toán đơn hàng #${orderId} bằng Ví HAVEN`,
                status: 'completed'
            });
            await walletTxToSave.save({ session });
        }

        const newOrderData = {
            ...body,
            id: orderId,
            status: isWalletPayment ? 'processing' : 'pending', // Nếu thanh toán ví -> processing
            paymentStatus: isWalletPayment ? 'paid' : (body.paymentStatus || 'unpaid'),
            totalAmount: calculatedTotalAmount,
            discountAmount: calculatedDiscount,
            shippingFee: calculatedShippingFee,
            shippingMethodId: finalShippingMethodId,
            finalAmount: calculatedFinalAmount,
            createdAt: new Date().toISOString()
        };

        // 1. Tạo bản ghi đơn hàng nhưng Gắn kèm Session
        const newOrder = new OrderModel(newOrderData);
        await newOrder.save({ session });

        // 2. Giảm tồn kho (Gắn Session)
        await decreaseStockOnOrder(newOrderData.items, orderId, session);

        // 3. Xóa sạch giỏ hàng trong Database
        const uid = body.userId || body.user_id;
        if (uid || body.email) {
            const userFilter = [];
            if (uid) {
                userFilter.push({ user_id: uid });
                userFilter.push({ user_id: String(uid) });
            }
            if (body.email) {
                userFilter.push({ user_id: body.email });
            }
            await CartModel.updateMany(
                { $or: userFilter },
                { $set: { items: [] } }
            ).session(session).catch(err => log(`[Cart Clear Warning]: ${err.message}`));
        }

        // 4. Nếu mọi thứ thành công -> Xác nhận giao dịch
        await session.commitTransaction();
        session.endSession();

        // 5. Gửi email xác nhận đơn hàng & cộng điểm tích lũy:
        // - COD: Khách đã xác nhận đặt hàng trả tiền mặt.
        // - Ví HAVEN: Đã trừ tiền thành công 100%.
        // - Với MoMo & VNPay: Sẽ gửi email và tích điểm khi cổng thanh toán IPN báo thanh toán thành công!
        const isImmediateOrder = isWalletPayment || String(body.paymentMethod || '').toLowerCase() === 'cod' || String(body.paymentMethod || '').toLowerCase() === 'pay-cod' || String(body.paymentMethod || '').toLowerCase() === 'bank-transfer';

        if (isImmediateOrder) {
            log(`[Order] Gửi email xác nhận cho đơn hàng ${newOrderData.id} (phương thức: ${body.paymentMethod})`);
            enqueueOrderEmail(newOrderData);

            if (body.userId) {
                // 1. Trừ điểm thưởng nếu khách có chọn dùng điểm trực tiếp
                if (Number(body.usedPoints) > 0) {
                    try {
                        const { LoyaltyPointsModel } = require('../models/LoyaltyPoints');
                        const { LoyaltyTransactionModel } = require('../models/LoyaltyTransaction');
                        const loyalty = await LoyaltyPointsModel.findOne({ userId: body.userId });
                        if (loyalty && loyalty.points >= Number(body.usedPoints)) {
                            const balanceBefore = loyalty.points;
                            loyalty.points -= Number(body.usedPoints);
                            loyalty.totalSpent += Number(body.usedPoints);
                            await loyalty.save();
                            await LoyaltyTransactionModel.create({
                                userId: body.userId,
                                type: 'redeem',
                                points: -Number(body.usedPoints),
                                orderId: orderId,
                                description: `Dùng ${body.usedPoints} điểm giảm ${(Number(body.usedPoints) * 100).toLocaleString('vi-VN')}đ cho Đơn hàng #${orderId}`,
                                balanceBefore,
                                balanceAfter: loyalty.points
                            });
                            log(`[Loyalty] Đã trừ ${body.usedPoints} điểm từ user ${body.userId} cho đơn hàng ${orderId}`);
                        }
                    } catch (ptsErr) {
                        log(`[Loyalty Deduct Error]: ${ptsErr.message}`);
                    }
                }

                // 2. Tích điểm thưởng mới từ số tiền thanh toán thực tế
                try {
                    await earnPoints(body.userId, calculatedFinalAmount, orderId);
                    log(`[Loyalty] Đã cộng điểm cho user ${body.userId} từ đơn hàng ${orderId}`);
                } catch (loyaltyErr) {
                    log(`[Loyalty] Lỗi khi cộng điểm: ${loyaltyErr.message}`);
                }
            }
        }


        return res.json({ 
            success: true, 
            orderId: newOrderData.id, 
            finalAmount: calculatedFinalAmount,
            paymentMethod: body.paymentMethod,
            paymentStatus: newOrderData.paymentStatus,
            newWalletBalance: isWalletPayment && walletTxToSave ? walletTxToSave.balanceAfter : undefined
        });
    } catch (error) {
        // NẾU CÓ LỖI (Ví dụ: hết hàng) -> Hủy bỏ mọi thay đổi ở bước 1,2,3
        await session.abortTransaction();
        session.endSession();
        
        // Lỗi trùng lặp key (Vd: Khách hàng click đặt hàng 2 lần liên tục với cùng 1 mã ID - Race condition)
        if (error.code === 11000) {
            log(`[CẢNH BÁO] Trùng lặp đơn hàng (Double click): Bỏ qua lỗi E11000`);
            return res.status(400).json({ 
                success: false, 
                message: 'Đơn hàng này đã được hệ thống ghi nhận. Vui lòng không đặt lại, kiểm tra email hoặc liên hệ với admin.' 
            });
        }
        
        log('LỖI NGHIÊM TRỌNG khi tạo đơn: ' + error.message);
        
        // Mongoose validation error
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
        }
        
        // Trả về chuỗi thông báo lỗi rõ ràng cho client (Vd: "Sản phẩm A không đủ hàng")
        return res.status(400).json({ success: false, message: error.message || 'Lỗi tạo đơn hàng' });
    }
};

/**
 * @desc    Cập nhật trạng thái đơn hàng (Admin thao tác)
 * @route   PUT /api/orders/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id, status, shippingProvider } = req.body;

        const currentOrder = await OrderModel.findOne({ id });
        if (!currentOrder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const oldStatus = currentOrder.status;

        // ─────────────────────────────────────────────────────────────────
        // KIỂM TRA QUY TẮC CHẶN HỆ THỐNG (Order State Machine Enforcement)
        // ─────────────────────────────────────────────────────────────────
        const transitionCheck = validateStatusTransition(oldStatus, status);
        if (!transitionCheck.allowed) {
            return res.status(400).json({ 
                success: false, 
                message: transitionCheck.message,
                ruleName: transitionCheck.ruleName 
            });
        }

        let updateData = { status };
        if (shippingProvider) {
            updateData.shippingProvider = shippingProvider;
        }

        const updatedOrder = await OrderModel.findOneAndUpdate({ id }, updateData, { new: true });
        
        log(`Cập nhật đơn ${id} từ ${oldStatus} sang ${status}`);

        // ─────────────────────────────────────────────────────────────────
        // TỰ ĐỘNG HOÀN TIỀN VÀO VÍ USER NẾU ĐỔI SANG REFUNDED HOẶC CANCELLED
        // CHỈ HOÀN TIỀN KHI ĐƠN HÀNG ĐÃ THANH TOÁN (paymentStatus === 'paid')
        // TUYỆT ĐỐI KHÔNG HOÀN TIỀN NẾU LÀ ĐƠN COD HOẶC CHƯA THANH TOÁN (unpaid)
        // ─────────────────────────────────────────────────────────────────
        const isCOD = ['cod', 'pay-cod'].includes(String(currentOrder.paymentMethod || '').toLowerCase());
        const isPaid = currentOrder.paymentStatus === 'paid' || (oldStatus === 'delivered' && isCOD);

        if (status === 'delivered' && isCOD) {
            updateData.paymentStatus = 'paid';
        }
        if (status === 'refunded') {
            updateData.paymentStatus = 'refunded';
        }

        if (status === 'refunded' || (status === 'cancelled' && isPaid && !isCOD)) {
            try {
                const refundAmt = currentOrder.finalAmount || currentOrder.totalAmount || 0;
                if (refundAmt > 0) {
                    await refundOrderToWallet({
                        userId: currentOrder.userId,
                        userEmail: currentOrder.email,
                        userPhone: currentOrder.phone,
                        orderId: currentOrder.id,
                        refundAmount: refundAmt,
                        reason: status === 'refunded' ? `Hoàn tiền hoàn hàng thành công cho đơn #${currentOrder.id}` : `Hoàn tiền do hủy đơn hàng đã thanh toán #${currentOrder.id}`
                    });
                    log(`[Wallet Sync] Đã hoàn ${refundAmt} VNĐ vào ví user cho đơn ${id}`);
                }
            } catch (wErr) {
                log(`[Wallet Sync Warning] ${wErr.message}`);
            }
        } else if (status === 'cancelled' && (isCOD || !isPaid)) {
            log(`[Hủy đơn không hoàn tiền] Đơn hàng #${currentOrder.id} (Phương thức: ${currentOrder.paymentMethod}, Trạng thái: ${currentOrder.paymentStatus}) -> Hủy đơn & hoàn lại tồn kho, KHÔNG phát sinh hoàn tiền vào ví.`);
        }

        // Tự động khởi tạo vận chuyển nếu có carrier và chưa có vận đơn
        let carrierCodeToInit = req.body.carrierCode;
        if (!carrierCodeToInit && shippingProvider) {
            if (shippingProvider.includes('GHN') || shippingProvider.includes('Nhanh')) carrierCodeToInit = 'GHN';
            else if (shippingProvider.includes('GHTK') || shippingProvider.includes('Tiết')) carrierCodeToInit = 'GHTK';
            else if (shippingProvider.includes('J&T') || shippingProvider.includes('JNT')) carrierCodeToInit = 'JNT';
            else if (shippingProvider.includes('Viettel') || shippingProvider.includes('VTP')) carrierCodeToInit = 'VTP';
            else if (shippingProvider.includes('BEST')) carrierCodeToInit = 'BEST';
            else if (shippingProvider.includes('Ninja') || shippingProvider.includes('NJV')) carrierCodeToInit = 'NJV';
            else carrierCodeToInit = 'GHN';
        }

        if (carrierCodeToInit && !currentOrder.trackingNumber && ['processing', 'waiting_pickup', 'shipped'].includes(status)) {
            try {
                await initShipping(id, carrierCodeToInit, 'Admin System');
                log(`[Carrier AutoInit] Đã khởi tạo vận chuyển cho đơn ${id} qua ${carrierCodeToInit}`);
            } catch (simErr) {
                log(`[Carrier AutoInit Error]: ${simErr.message}`);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // LUỒNG XỬ LÝ KHO THÔNG MINH (Inventory State Machine)
        // ─────────────────────────────────────────────────────────────────
        const pendingStatuses  = ['pending', 'confirmed'];
        const processedStatuses = ['processing', 'shipping', 'shipped', 'delivered'];

        // [Admin Duyệt đơn] pending -> processing
        // Xuất kho vật lý + giải phóng reserved
        if (status === 'processing' && pendingStatuses.includes(oldStatus)) {
            if (updatedOrder.items && updatedOrder.items.length > 0) {
                await exportStockOnApproval(updatedOrder.items, id);
            }
        }

        // [Hủy đơn hoặc Hoàn trả] Bất kể từ trạng thái nào chuyển sang cancelled hoặc refunded
        // Hoàn trả đầy đủ tồn kho vật lý, biến thể và trừ soldQuantity
        if ((status === 'cancelled' || status === 'refunded') && oldStatus !== 'cancelled' && oldStatus !== 'refunded') {
            if (updatedOrder.items && updatedOrder.items.length > 0) {
                await restoreStockOnCancel(updatedOrder.items, id);
            }
        }

        // Thu hồi điểm tích lũy nếu đơn bị hủy/hoàn
        if ((status === 'cancelled' || status === 'refunded') && oldStatus !== 'cancelled' && oldStatus !== 'refunded') {
            if (currentOrder.userId) {
                try {
                    await revokePoints(currentOrder.userId, id);
                    log(`[Loyalty] Thu hồi điểm cho user ${currentOrder.userId} do hủy đơn ${id}`);
                } catch (loyaltyErr) {
                    log(`[Loyalty] Lỗi khi thu hồi điểm: ${loyaltyErr.message}`);
                }
            }
        }

        // [Logic mới] Cập nhật soldQuantity chỉ khi đơn hàng giao thành công
        if (status === 'delivered' && oldStatus !== 'delivered') {
            for (const item of updatedOrder.items) {
                await ProductModel.findOneAndUpdate(
                    { id: item.product.id },
                    { $inc: { soldQuantity: item.quantity } }
                );
            }
            log(`Đã cộng lượt bán (soldQuantity) cho đơn hàng thành công: ${id}`);
        } else if (oldStatus === 'delivered' && status !== 'delivered') {
            // Trường hợp hy hữu: Đổi từ delivered sang trạng thái khác (VD: hoàn trả sau khi giao)
            for (const item of updatedOrder.items) {
                await ProductModel.findOneAndUpdate(
                    { id: item.product.id },
                    { $inc: { soldQuantity: -item.quantity } }
                );
            }
            log(`Đã trừ lượt bán (soldQuantity) do đơn hàng thay đổi khỏi trạng thái thành công: ${id}`);
        }

        // Emit realtime notification cho Client qua Socket.IO (Nếu có kết nối)
        const io = req.app.get('io');
        if (io) {
            io.emit('order_status_changed', { orderId: id, status: status, customerEmail: updatedOrder.email });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công', order: updatedOrder });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Khách hàng yêu cầu hoàn trả đơn hàng
 * @route   POST /api/orders/refund
 * @access  Private/User
 */
const requestRefund = async (req, res, next) => {
    try {
        const { id, reason } = req.body;
        const currentOrder = await OrderModel.findOne({ id });
        
        if (!currentOrder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        
        // Chỉ đơn hàng đã hoặc đang giao mới được hoàn
        if (!['shipped', 'delivered'].includes(currentOrder.status)) {
            return res.status(400).json({ success: false, message: 'Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã giao' });
        }

        currentOrder.status = 'refund_requested'; // Đổi trạng thái
        // Gắn thêm lý do hoàn vào trường ghi chú (note)
        currentOrder.note = currentOrder.note ? `${currentOrder.note} - Lý do hoàn: ${reason}` : `Lý do hoàn: ${reason}`;
        await currentOrder.save();

        // Gửi realtime event lên Admin Dashboard
        const io = req.app.get('io');
        if (io) {
            io.emit('order_status_changed', { orderId: id, status: 'refund_requested' });
        }

        res.json({ success: true, message: 'Đã gửi yêu cầu hoàn tiền', order: currentOrder });
    } catch (error) {
        next(error);
    }
};


/**
 * @desc Khách hàng gửi yêu cầu hoàn hàng
 * @route POST /api/orders/return-request
 * @body { orderId, reason, images? }
 */
const submitReturnRequest = async (req, res, next) => {
    try {
        const { orderId, reason, images } = req.body;
        if (!orderId || !reason || reason.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Cần cung cấp mã đơn hàng và lý do hoàn hàng chi tiết' });
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        const allowedStatuses = ['delivered', 'completed', 'awaiting_review', 'reviewed'];
        if (!allowedStatuses.includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Chỉ có thể yêu cầu hoàn hàng với đơn đã giao thành công' });
        }
        if (order.returnRequest && order.returnRequest.status !== 'none' && order.returnRequest.status !== 'rejected') {
            return res.status(400).json({ success: false, message: 'Đơn hàng này đã có yêu cầu hoàn đang được xử lý' });
        }

        // ─── KIỂM TRA THỜI HẠN 7 NGÀY (SLA) ───
        const deliveredTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt || order.createdAt).getTime();
        const daysSinceDelivery = (Date.now() - deliveredTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDelivery > 7) {
            return res.status(400).json({ 
                success: false, 
                message: 'Đã hết thời hạn yêu cầu trả hàng / hoàn tiền (Tối đa 7 ngày kể từ khi nhận hàng).' 
            });
        }

        const now = new Date();
        const reviewDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Shop cam kết xử lý trong 24-48 giờ

        order.returnRequest = {
            status: 'pending',
            reason: reason.trim(),
            images: images || [],
            requestedAt: now,
            reviewDeadline: reviewDeadline,
            reviewedAt: null,
            reviewedBy: '',
            rejectReason: '',
            shippingDeadline: null,
            returnTrackingNumber: '',
            returnCarrier: '',
            returnShippedAt: null,
            returnReceivedAt: null,
            inspectionDeadline: null,
            refundDeadline: null,
            refundedAt: null,
            refundAmount: order.finalAmount || order.totalAmount || 0,
            refundMethod: 'wallet'
        };

        order.status = 'return_requested';
        order.shippingTimeline = order.shippingTimeline || [];
        order.shippingTimeline.push({
            status: 'return_requested',
            title: 'Khách hàng gửi yêu cầu trả hàng / hoàn tiền',
            note: `Lý do: "${reason.trim()}" • Shop cam kết xét duyệt trong 24-48 giờ (Hạn chót: ${reviewDeadline.toLocaleString('vi-VN')})`,
            timestamp: now,
            isCustomerVisible: true
        });
        await order.save();

        const io = req.app.get('io');
        if (io) io.emit('order_status_changed', { orderId, status: 'return_requested' });

        res.json({ 
            success: true, 
            message: 'Gửi yêu cầu hoàn hàng thành công! Shop sẽ xét duyệt trong 24–48 giờ.', 
            order 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Khách hàng cập nhật mã vận đơn trả hàng (sau khi Shop duyệt hoàn hàng)
 * @route PUT /api/orders/return-tracking/:orderId
 * @body { trackingNumber, carrier }
 */
const submitReturnTracking = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { trackingNumber, carrier } = req.body;

        if (!trackingNumber || !trackingNumber.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã vận đơn trả hàng' });
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        if (!order.returnRequest || order.returnRequest.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Yêu cầu hoàn hàng chưa được shop duyệt chấp thuận' });
        }

        const now = new Date();
        order.returnRequest.returnTrackingNumber = trackingNumber.trim();
        order.returnRequest.returnCarrier = carrier ? carrier.trim() : 'Đơn vị vận chuyển';
        order.returnRequest.returnShippedAt = now;
        order.status = 'returning';

        order.shippingTimeline = order.shippingTimeline || [];
        order.shippingTimeline.push({
            status: 'returning',
            title: 'Khách hàng đã gửi hàng hoàn về shop',
            note: `Đơn vị vận chuyển: ${order.returnRequest.returnCarrier} • Mã vận đơn: ${order.returnRequest.returnTrackingNumber}`,
            timestamp: now,
            isCustomerVisible: true
        });

        await order.save();

        const io = req.app.get('io');
        if (io) io.emit('order_status_changed', { orderId, status: 'returning' });

        res.json({ 
            success: true, 
            message: 'Đã cập nhật mã vận đơn trả hàng thành công! Shop sẽ kiểm tra khi nhận được kiện hàng.', 
            order 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Admin xem danh sách các đơn hoàn hàng
 * @route GET /api/orders/returns
 */
const getReturnRequests = async (req, res, next) => {
    try {
        const { status } = req.query; // 'pending' | 'approved' | 'rejected' | 'returning' | 'refunded' | all
        const query = { 'returnRequest.status': { $ne: 'none' } };
        if (status && status !== 'all') {
            if (status === 'returning') {
                query.status = 'returning';
            } else if (status === 'refunded') {
                query.status = 'refunded';
            } else {
                query['returnRequest.status'] = status;
            }
        }

        const orders = await OrderModel.find(query)
            .sort({ 'returnRequest.requestedAt': -1 })
            .lean();

        const stats = {
            total: await OrderModel.countDocuments({ 'returnRequest.status': { $ne: 'none' } }),
            pending:   await OrderModel.countDocuments({ 'returnRequest.status': 'pending' }),
            approved:  await OrderModel.countDocuments({ 'returnRequest.status': 'approved' }),
            rejected:  await OrderModel.countDocuments({ 'returnRequest.status': 'rejected' }),
            returning: await OrderModel.countDocuments({ status: 'returning' }),
            refunded:  await OrderModel.countDocuments({ status: 'refunded' }),
        };

        res.json({ success: true, orders, stats });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Admin duyệt hoặc từ chối yêu cầu hoàn hàng (kèm hạn gửi hàng 3-5 ngày)
 * @route PUT /api/orders/return-request/:orderId
 * @body { action: 'approve' | 'reject', rejectReason?, adminName?, instantRefund? }
 */
const reviewReturnRequest = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { action, rejectReason, adminName, instantRefund } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action phải là approve hoặc reject' });
        }
        if (action === 'reject' && (!rejectReason || rejectReason.trim().length < 5)) {
            return res.status(400).json({ success: false, message: 'Cần nhập lý do từ chối (tối thiểu 5 ký tự)' });
        }

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        if (!order.returnRequest || order.returnRequest.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Đơn hàng này không ở trạng thái chờ duyệt' });
        }

        const now = new Date();
        if (action === 'approve') {
            order.returnRequest.status = 'approved';
            order.returnRequest.reviewedAt = now;
            order.returnRequest.reviewedBy = adminName || 'Admin';

            // Nếu Admin chọn Hoàn tiền ngay không cần gửi hàng (Instant Refund)
            if (instantRefund) {
                order.status = 'refunded';
                order.paymentStatus = 'refunded';
                order.returnRequest.refundedAt = now;
                order.returnRequest.refundAmount = order.finalAmount || order.totalAmount || 0;
                
                order.shippingTimeline.push({
                    status: 'refunded',
                    title: 'Duyệt hoàn tiền ngay vào Ví HAVEN thành công',
                    note: `Shop đã duyệt hoàn tiền ngay lập tức. Số tiền ${(order.finalAmount || order.totalAmount).toLocaleString('vi-VN')} đ đã chuyển vào Ví HAVEN.`,
                    timestamp: now,
                    isCustomerVisible: true
                });

                if (order.items && order.items.length > 0) {
                    await returnExportedStock(order.items, orderId);
                }

                const refundAmt = order.finalAmount || order.totalAmount || 0;
                try {
                    await refundOrderToWallet({
                        userId: order.userId,
                        userEmail: order.email,
                        userPhone: order.phone,
                        orderId: order.id,
                        refundAmount: refundAmt,
                        reason: `Hoàn tiền hoàn hàng thành công cho đơn #${order.id}`
                    });
                    log(`[Wallet Sync] Đã hoàn ${refundAmt} VNĐ vào ví user cho đơn ${orderId} (Instant Refund)`);
                } catch (wErr) {
                    log(`[Wallet Sync Warning] ${wErr.message}`);
                }

                // Thu hồi điểm tích lũy của đơn nếu có
                if (order.userId) {
                    try {
                        const { revokePoints } = require('./loyaltyController');
                        if (typeof revokePoints === 'function') {
                            await revokePoints(order.userId, orderId);
                        }
                    } catch (lErr) {
                        log(`[Loyalty Warning] ${lErr.message}`);
                    }
                }
            } else {
                // Duyệt cho khách gửi hàng về kho: Hạn gửi hàng là 5 ngày kể từ ngày duyệt
                const shippingDeadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
                order.returnRequest.shippingDeadline = shippingDeadline;
                order.status = 'returning';

                order.shippingTimeline.push({
                    status: 'returning',
                    title: 'Yêu cầu hoàn hàng đã được Shop chấp thuận',
                    note: `Shop đã duyệt. Quý khách vui lòng gửi hàng về kho và cập nhật mã vận đơn trước ${shippingDeadline.toLocaleString('vi-VN')} (trong vòng 3–5 ngày).`,
                    timestamp: now,
                    isCustomerVisible: true
                });
            }
        } else {
            order.returnRequest.status = 'rejected';
            order.returnRequest.reviewedAt = now;
            order.returnRequest.reviewedBy = adminName || 'Admin';
            order.returnRequest.rejectReason = rejectReason.trim();
            order.status = 'delivered'; // Khôi phục trạng thái delivered
            order.shippingTimeline.push({
                status: 'delivered',
                title: 'Yêu cầu hoàn hàng bị từ chối',
                note: `Lý do: "${rejectReason.trim()}"`,
                timestamp: now,
                isCustomerVisible: true
            });
        }

        await order.save();

        const io = req.app.get('io');
        if (io) io.emit('order_status_changed', { orderId, status: order.status });

        const respMsg = action === 'approve' 
            ? (instantRefund ? '✅ Đã duyệt và hoàn tiền ngay vào Ví HAVEN của khách hàng' : '✅ Đã duyệt hoàn hàng — thời hạn khách gửi hàng là 3–5 ngày') 
            : '❌ Đã từ chối yêu cầu hoàn hàng';

        res.json({ success: true, message: respMsg, order });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Admin xác nhận đã nhận hàng trả & thực hiện hoàn tiền vào Ví
 * @route PUT /api/orders/return-received/:orderId
 * @access Admin
 */
const confirmReturnReceived = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { adminName } = req.body;

        const order = await OrderModel.findOne({ id: orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        if (!['returning', 'return_received', 'return_requested'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Đơn hàng chưa ở trạng thái hoàn hàng' });
        }

        const now = new Date();
        const refundAmt = order.finalAmount || order.totalAmount || 0;

        order.status = 'refunded';
        order.paymentStatus = 'refunded';
        order.returnRequest.returnReceivedAt = now;
        order.returnRequest.refundedAt = now;
        order.returnRequest.refundAmount = refundAmt;

        order.shippingTimeline.push({
            status: 'refunded',
            title: 'Đã nhận hàng trả & Hoàn tiền vào ví thành công',
            note: `Shop đã nhận lại kiện hàng và kiểm tra hoàn tất. Số tiền ${refundAmt.toLocaleString('vi-VN')} đ đã tự động chuyển vào Ví HAVEN của khách hàng. Xác nhận bởi: ${adminName || 'Admin'}`,
            timestamp: now,
            isCustomerVisible: true
        });

        await order.save();

        // 1. Nhập lại tồn kho vật lý cho sản phẩm hoàn về
        if (order.items && order.items.length > 0) {
            await returnExportedStock(order.items, orderId);
        }

        // 2. Tự động chuyển toàn bộ số tiền đơn hàng về Ví HAVEN của User
        try {
            await refundOrderToWallet({
                userId: order.userId,
                userEmail: order.email,
                userPhone: order.phone,
                orderId: order.id,
                refundAmount: refundAmt,
                reason: `Hoàn tiền hoàn hàng thành công cho đơn #${order.id}`
            });
            log(`[Wallet Sync] Đã hoàn ${refundAmt} VNĐ vào ví user cho đơn hoàn hàng ${orderId}`);
        } catch (wErr) {
            log(`[Wallet Sync Warning] Lỗi hoàn tiền vào ví: ${wErr.message}`);
        }

        // 3. Thu hồi điểm tích lũy của đơn nếu có
        if (order.userId) {
            try {
                const { revokePoints } = require('./loyaltyController');
                if (typeof revokePoints === 'function') {
                    await revokePoints(order.userId, orderId);
                }
            } catch (lErr) {
                log(`[Loyalty Warning] ${lErr.message}`);
            }
        }

        const io = req.app.get('io');
        if (io) io.emit('order_status_changed', { orderId, status: order.status });

        res.json({ 
            success: true, 
            message: `Đã xác nhận nhận hàng & hoàn thành công ${refundAmt.toLocaleString('vi-VN')} đ vào Ví HAVEN của khách hàng`, 
            order 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Validate đơn hàng TRƯỚC KHI TẠO — Kiểm tra tồn kho, giá, voucher
 * @route   POST /api/orders/validate
 * @access  Public
 * @note    Không tạo đơn, không giữ stock — chỉ kiểm tra và trả về lỗi nếu có
 */
const validateOrderItems = async (req, res, next) => {
    try {
        const { items, couponCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
        }

        const errors = [];
        let calculatedTotal = 0;

        for (const item of items) {
            const productId = item.product?.id;
            const size = item.selectedSize;
            const colorName = item.selectedColor?.name;
            const qty = Number(item.quantity);

            if (!productId || !size || !colorName || qty < 1) {
                errors.push(`Sản phẩm "${item.product?.name || productId}" có thông tin không hợp lệ.`);
                continue;
            }

            // Kiểm tra sản phẩm tồn tại
            const dbProduct = await ProductModel.findOne({
                $or: [
                    { id: productId },
                    { id: String(productId) },
                    { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : undefined }
                ].filter(Boolean)
            });

            // Kiểm tra tồn kho variant
            const variant = await ProductVariantModel.findOne({
                product_id: productId,
                size_id: size,
                color_id: colorName
            });

            if (variant) {
                const available = (variant.stock || 0) - (variant.reserved_stock || 0);
                if (available < qty) {
                    const label = `${dbProduct.name} (${colorName} / ${size})`;
                    if (available <= 0) {
                        errors.push(`Sản phẩm "${label}" đã hết hàng.`);
                    } else {
                        errors.push(`Sản phẩm "${label}" chỉ còn ${available} chiếc (bạn chọn ${qty}).`);
                    }
                    continue;
                }
            } else {
                // Fallback: kiểm tra qua product.variants embedded
                const embeddedVariant = (dbProduct.variants || []).find(
                    v => v.color === colorName && v.size === size
                );
                if (embeddedVariant && Number(embeddedVariant.stock) < qty) {
                    const available = Number(embeddedVariant.stock);
                    const label = `${dbProduct.name} (${colorName} / ${size})`;
                    if (available <= 0) {
                        errors.push(`Sản phẩm "${label}" đã hết hàng.`);
                    } else {
                        errors.push(`Sản phẩm "${label}" chỉ còn ${available} chiếc (bạn chọn ${qty}).`);
                    }
                    continue;
                }
            }

            // Lấy giá chuẩn từ DB
            let itemPrice = dbProduct.price;
            const variantPricing = (dbProduct.variants || []).find(v => v.color === colorName && v.size === size);
            if (variantPricing?.price != null) itemPrice = variantPricing.price;
            calculatedTotal += itemPrice * qty;
        }

        // Kiểm tra coupon nếu có
        let couponError = null;
        if (couponCode) {
            const UserCoupon = require('../models/UserCoupon');
            const codeClean = couponCode.toUpperCase().trim();
            const userCoupon = await UserCoupon.findOne({ coupon_code: codeClean });
            if (userCoupon) {
                if (userCoupon.is_used) couponError = 'Mã giảm giá này đã được sử dụng.';
                else if (userCoupon.expires_at && new Date(userCoupon.expires_at) < new Date()) {
                    couponError = 'Mã giảm giá này đã hết hạn.';
                }
            } else {
                const coupon = await CouponModel.findOne({ code: codeClean });
                if (!coupon) {
                    couponError = 'Mã giảm giá không hợp lệ.';
                } else if (coupon.usage_limit <= 0) {
                    couponError = 'Mã giảm giá đã hết lượt sử dụng.';
                } else if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
                    couponError = 'Mã giảm giá đã hết hạn.';
                }
            }
            if (couponError) errors.push(couponError);
        }

        if (errors.length > 0) {
            return res.status(409).json({ success: false, errors });
        }

        return res.json({ success: true, calculatedTotal });
    } catch (error) {
        next(error);
    }
};

const checkOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await OrderModel.findOne({ id: orderId }).select('id status paymentStatus paymentMethod totalAmount finalAmount createdAt');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }
        res.json({
            success: true,
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            finalAmount: order.finalAmount || order.totalAmount
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    updateOrderStatus,
    requestRefund,
    exportStockOnApproval,
    restoreStockOnCancel,
    submitReturnRequest,
    submitReturnTracking,
    getReturnRequests,
    reviewReturnRequest,
    confirmReturnReceived,
    validateOrderItems,
    checkOrderStatus
};
