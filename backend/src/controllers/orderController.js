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
const { InventoryHistoryModel } = require('../models/InventoryHistory');
const { CouponModel } = require('../models/Coupon');
// Sử dụng BullMQ queue để gửi email bất đồng bộ (không làm chậm tốc độ tạo đơn)
const { enqueueOrderEmail } = require('../services/queueService');

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
            const color = item.selectedColor.name;
            const quantity = item.quantity;

            // 1. Cập nhật thống kê bán ra trên model Sản phẩm (Product) chính
            const product = await ProductModel.findOne({ id: productId }).session(session);
            if (product && product.variants) {
                const variant = product.variants.find(v => v.color === color && v.size === size);
                if (variant) {
                    product.markModified('variants');
                    // Tăng số lượng đã bán của toàn bộ sản phẩm
                    product.soldQuantity = (product.soldQuantity || 0) + quantity;
                    await product.save({ session });
                }
            }

            // 2. Cập nhật tồn kho (Stock) trên model Biến thể (ProductVariant)
            // Lọc: Phải đảm bảo (tồn kho - tồn kho đang giữ) >= số lượng khách mua
            const pVariant = await ProductVariantModel.findOneAndUpdate(
                { 
                    product_id: productId, 
                    size_id: size, 
                    color_id: color,
                    $expr: { $gte: [{ $subtract: ["$stock", { $ifNull: ["$reserved_stock", 0] }] }, quantity] }
                },
                // Tăng "Tồn kho đang giữ" (dành cho đơn này) thay vì trừ thẳng vào kho thực tế
                { $inc: { reserved_stock: quantity } },
                { new: true, session }
            );

            // Nếu không tìm thấy hoặc không thỏa mãn $expr (không đủ hàng) -> Báo lỗi
            if (!pVariant) {
                throw new Error(`Sản phẩm ${item.product.name} không đủ hàng.`);
            }

            // 3. Tạo log lịch sử biến động kho
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant.id,
                type: 'export', // Xuất kho (giữ chỗ)
                quantity: quantity,
                note: `Giữ chỗ tồn kho cho Đơn hàng #${orderId}`,
                created_at: new Date().toISOString()
            });
            await invLog.save({ session });
        }
        log(`Đã giữ chỗ tồn kho thành công cho đơn hàng: ${orderId}`);
    } catch (error) {
        log(`Lỗi khi trừ tồn kho (decreaseStockOnOrder): ${error.message}`);
        throw error; // Quăng lỗi lên trên để abort transaction
    }
};

/**
 * @desc Hoàn lại tồn kho khi đơn hàng bị hủy hoặc hoàn tiền
 * @param {Array} orderItems - Danh sách sản phẩm trong đơn
 * @param {String} orderId - Mã đơn hàng
 */
const increaseStockOnCancellation = async (orderItems, orderId) => {
    try {
        for (const item of orderItems) {
            const productId = item.product.id;
            const size = item.selectedSize;
            const color = item.selectedColor.name;
            const quantity = item.quantity;

            // 1. Giảm đi số lượng "đã bán" trong ProductModel
            const product = await ProductModel.findOne({ id: productId });
            if (product && product.variants) {
                const variant = product.variants.find(v => v.color === color && v.size === size);
                if (variant) {
                    product.markModified('variants');
                    product.soldQuantity = Math.max(0, (product.soldQuantity || 0) - quantity);
                    await product.save();
                }
            }

            // 2. Trừ bớt "Tồn kho đang giữ" (reserved_stock) trả lại vào khả dụng
            const pVariant = await ProductVariantModel.findOneAndUpdate(
                { product_id: productId, size_id: size, color_id: color },
                { $inc: { reserved_stock: -quantity } },
                { new: true }
            );

            // 3. Tạo log hoàn trả kho
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant ? pVariant.id : `variant-${productId}-${color.toLowerCase()}-${size.toLowerCase()}`,
                type: 'import', // Nhập kho (trả lại)
                quantity: quantity,
                note: `Hoàn giữ chỗ tự động do Hủy Đơn hàng #${orderId}`,
                created_at: new Date().toISOString()
            });
            await invLog.save();
        }
        log(`Đã hoàn trả tồn kho dự trữ cho đơn hủy: ${orderId}`);
    } catch (error) {
        log(`Lỗi khi hoàn trả tồn kho (increaseStockOnCancellation): ${error.message}`);
    }
};

/**
 * @desc    Lấy danh sách đơn hàng (Có thể lọc theo email user)
 * @route   GET /api/orders
 * @access  Private / User / Admin
 */
const getOrders = async (req, res, next) => {
    try {
        const email = typeof req.query.email === 'string' ? req.query.email : undefined;
        // Nếu user bình thường gọi, gửi query ?email=...
        // Nếu Admin gọi, không truyền email sẽ lấy toàn bộ
        const filter = email ? { email } : {};
        const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

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

        // Mã đơn hàng: Lấy từ client hoặc tự sinh dạng LF-ABCXYZ
        const orderId = body.id || `LF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

        const newOrderData = {
            ...body,
            id: orderId,
            status: 'pending', // Chờ xác nhận
            finalAmount: body.finalAmount ?? body.totalAmount, // Đảm bảo luôn có finalAmount
            createdAt: new Date().toISOString()
        };

        // 1. Tạo bản ghi đơn hàng nhưng Gắn kèm Session
        const newOrder = new OrderModel(newOrderData);
        await newOrder.save({ session });

        // 2. Giảm tồn kho (Gắn Session)
        if (newOrderData.items && newOrderData.items.length > 0) {
            await decreaseStockOnOrder(newOrderData.items, orderId, session);
        }

        // 3. Áp dụng & Trừ lượt mã giảm giá (Gắn Session)
        if (newOrderData.couponCode) {
            const coupon = await CouponModel.findOne({ code: newOrderData.couponCode }).session(session);
            
            // Kiểm tra giới hạn sử dụng trên mỗi user (usage_limit_per_user)
            if (coupon && coupon.usage_limit_per_user > 0) {
                const userUsedCount = await OrderModel.countDocuments({ 
                    couponCode: coupon.code, 
                    email: newOrderData.email, 
                    status: { $ne: 'cancelled' } // Không tính các đơn đã hủy
                }).session(session);
                
                // Trừ đi 1 do bản ghi current Order (phía trên) đã được đếm vào
                // Thực tế logic này có rủi ro nếu tính cả order hiện tại, nên cần cẩn thận logic
                // Ở đây do order hiện tại đã lưu bằng session, nên countDocuments sẽ tìm thấy nó.
                // Do đó, nếu user đã dùng trước đó >= limit, count sẽ > limit.
                if (userUsedCount >= coupon.usage_limit_per_user) {
                    throw new Error('Bạn đã hết lượt sử dụng mã giảm giá này.');
                }
            }

            // Trừ 1 lượt của tổng số lượng coupon có sẵn
            await CouponModel.findOneAndUpdate(
                { code: newOrderData.couponCode },
                { $inc: { usage_limit: -1 } },
                { session }
            );
        }

        // 4. Nếu mọi thứ thành công -> Xác nhận giao dịch
        await session.commitTransaction();
        session.endSession();

        // 5. Gửi email xác nhận (Chạy bất đồng bộ qua Redis Queue - BullMQ)
        enqueueOrderEmail(newOrderData);

        return res.json({ success: true, orderId: newOrderData.id });
    } catch (error) {
        // NẾU CÓ LỖI (Ví dụ: hết hàng) -> Hủy bỏ mọi thay đổi ở bước 1,2,3
        await session.abortTransaction();
        session.endSession();
        
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
        const { id, status } = req.body;

        const currentOrder = await OrderModel.findOne({ id });
        if (!currentOrder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const oldStatus = currentOrder.status;
        const updatedOrder = await OrderModel.findOneAndUpdate({ id }, { status }, { new: true });
        
        log(`Cập nhật đơn ${id} từ ${oldStatus} sang ${status}`);

        // --- Logic Hoàn lại kho khi hủy ---
        // Nếu chuyển trạng thái sang Hủy ('cancelled') hoặc Đã hoàn tiền ('refunded')
        if ((status === 'cancelled' && oldStatus !== 'cancelled') || 
            (status === 'refunded' && oldStatus !== 'refunded')) {
            if (updatedOrder.items && updatedOrder.items.length > 0) {
                await increaseStockOnCancellation(updatedOrder.items, id);
            }
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

module.exports = {
    getOrders,
    createOrder,
    updateOrderStatus,
    requestRefund
};
