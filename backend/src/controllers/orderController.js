const mongoose = require('mongoose');
const { OrderModel } = require('../models/Order');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');
const { InventoryHistoryModel } = require('../models/InventoryHistory');
const { CouponModel } = require('../models/Coupon');
// Thay thế sendOrderConfirmationEmail bằng enqueueOrderEmail
const { enqueueOrderEmail } = require('../services/queueService');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [OrderController] ${msg}\n`);
    console.log(`[OrderController] ${msg}`);
}

const decreaseStockOnOrder = async (orderItems, orderId, session) => {
    try {
        for (const item of orderItems) {
            const productId = item.product.id;
            const size = item.selectedSize;
            const color = item.selectedColor.name;
            const quantity = item.quantity;

            // 1. Update Product Model embedded variants
            const product = await ProductModel.findOne({ id: productId }).session(session);
            if (product && product.variants) {
                const variant = product.variants.find(v => v.color === color && v.size === size);
                if (variant) {
                    product.markModified('variants');
                    product.soldQuantity = (product.soldQuantity || 0) + quantity;
                    await product.save({ session });
                }
            }

            // 2. Update ProductVariant Model
            const pVariant = await ProductVariantModel.findOneAndUpdate(
                { 
                    product_id: productId, 
                    size_id: size, 
                    color_id: color,
                    $expr: { $gte: [{ $subtract: ["$stock", "$reserved_stock"] }, quantity] }
                },
                { $inc: { reserved_stock: quantity } },
                { new: true, session }
            );

            if (!pVariant) {
                throw new Error(`Sản phẩm ${item.product.name} không đủ hàng.`);
            }

            // 3. Create inventory log
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant.id,
                type: 'export',
                quantity: quantity,
                note: `Giữ chỗ tồn kho cho Đơn hàng #${orderId}`,
                created_at: new Date().toISOString()
            });
            await invLog.save({ session });
        }
        log(`Stock reserved successfully for order: ${orderId}`);
    } catch (error) {
        log(`Error in decreaseStockOnOrder: ${error.message}`);
        throw error;
    }
};

const increaseStockOnCancellation = async (orderItems, orderId) => {
    try {
        for (const item of orderItems) {
            const productId = item.product.id;
            const size = item.selectedSize;
            const color = item.selectedColor.name;
            const quantity = item.quantity;

            const product = await ProductModel.findOne({ id: productId });
            if (product && product.variants) {
                const variant = product.variants.find(v => v.color === color && v.size === size);
                if (variant) {
                    product.markModified('variants');
                    product.soldQuantity = Math.max(0, (product.soldQuantity || 0) - quantity);
                    await product.save();
                }
            }

            const pVariant = await ProductVariantModel.findOneAndUpdate(
                { product_id: productId, size_id: size, color_id: color },
                { $inc: { reserved_stock: -quantity } },
                { new: true }
            );

            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant ? pVariant.id : `variant-${productId}-${color.toLowerCase()}-${size.toLowerCase()}`,
                type: 'import',
                quantity: quantity,
                note: `Hoàn giữ chỗ tự động do Hủy Đơn hàng #${orderId}`,
                created_at: new Date().toISOString()
            });
            await invLog.save();
        }
        log(`Reserved stock restored automatically for cancelled order: ${orderId}`);
    } catch (error) {
        log(`Error in increaseStockOnCancellation: ${error.message}`);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const email = typeof req.query.email === 'string' ? req.query.email : undefined;
        const filter = email ? { email } : {};
        const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        log('--- NEW ORDER REQUEST ---');
        const body = req.body;

        const orderId = body.id || `LF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

        const newOrderData = {
            ...body,
            id: orderId,
            status: 'pending',
            finalAmount: body.finalAmount ?? body.totalAmount,
            createdAt: new Date().toISOString()
        };

        const newOrder = new OrderModel(newOrderData);
        await newOrder.save({ session });

        // Decrease Stock (with session)
        if (newOrderData.items && newOrderData.items.length > 0) {
            await decreaseStockOnOrder(newOrderData.items, orderId, session);
        }

        // Cập nhật Coupon (with session)
        if (newOrderData.couponCode) {
            await CouponModel.findOneAndUpdate(
                { code: newOrderData.couponCode },
                { $inc: { usage_limit: -1 } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        // Push task to BullMQ
        enqueueOrderEmail(newOrderData);

        return res.json({ success: true, orderId: newOrderData.id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        log('CRITICAL error: ' + error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
        }
        // Trả về lỗi rõ ràng cho client nếu không đủ hàng
        return res.status(400).json({ success: false, message: error.message || 'Lỗi tạo đơn hàng' });
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { id, status } = req.body;

        // Lấy thông tin đơn hàng hiện tại để xem status có thay đổi sang cancelled không
        const currentOrder = await OrderModel.findOne({ id });
        if (!currentOrder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const oldStatus = currentOrder.status;
        const updatedOrder = await OrderModel.findOneAndUpdate({ id }, { status }, { new: true });
        
        log(`Updated order ${id} status from ${oldStatus} to ${status}`);

        // Nếu chuyển trạng thái sang cancelled hoặc refunded
        if ((status === 'cancelled' && oldStatus !== 'cancelled') || 
            (status === 'refunded' && oldStatus !== 'refunded')) {
            if (updatedOrder.items && updatedOrder.items.length > 0) {
                await increaseStockOnCancellation(updatedOrder.items, id);
            }
        }

        // Emit realtime notification
        const io = req.app.get('io');
        if (io) {
            io.emit('order_status_changed', { orderId: id, status: status, customerEmail: updatedOrder.email });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công', order: updatedOrder });
    } catch (error) {
        next(error);
    }
};

const requestRefund = async (req, res, next) => {
    try {
        const { id, reason } = req.body;
        const currentOrder = await OrderModel.findOne({ id });
        if (!currentOrder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        
        if (!['shipped', 'delivered'].includes(currentOrder.status)) {
            return res.status(400).json({ success: false, message: 'Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã giao' });
        }

        currentOrder.status = 'refund_requested';
        currentOrder.note = currentOrder.note ? `${currentOrder.note} - Lý do hoàn: ${reason}` : `Lý do hoàn: ${reason}`;
        await currentOrder.save();

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
