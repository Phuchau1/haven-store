const { OrderModel } = require('../models/Order');
const { ProductModel } = require('../models/Product');
const { ProductVariantModel } = require('../models/ProductVariant');
const { InventoryHistoryModel } = require('../models/InventoryHistory');
const { CouponModel } = require('../models/Coupon');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [OrderController] ${msg}\n`);
    console.log(`[OrderController] ${msg}`);
}

const decreaseStockOnOrder = async (orderItems, orderId) => {
    try {
        for (const item of orderItems) {
            const productId = item.product.id;
            const size = item.selectedSize;
            const color = item.selectedColor.name;
            const quantity = item.quantity;

            // 1. Update Product Model embedded variants
            const product = await ProductModel.findOne({ id: productId });
            if (product && product.variants) {
                const variant = product.variants.find(v => v.color === color && v.size === size);
                if (variant) {
                    variant.stock = Math.max(0, variant.stock - quantity);
                    product.markModified('variants');
                    product.soldQuantity = (product.soldQuantity || 0) + quantity;
                    await product.save();
                }
            }

            // 2. Update ProductVariant Model
            const pVariant = await ProductVariantModel.findOneAndUpdate(
                { product_id: productId, size_id: size, color_id: color },
                { $inc: { stock: -quantity } },
                { new: true }
            );

            // 3. Create inventory log
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant ? pVariant.id : `variant-${productId}-${color.toLowerCase()}-${size.toLowerCase()}`,
                type: 'export',
                quantity: quantity,
                note: `Xuất kho tự động cho Đơn hàng #${orderId}`,
                created_at: new Date().toISOString()
            });
            await invLog.save();
        }
        log(`Stock decreased automatically for order: ${orderId}`);
    } catch (error) {
        log(`Error in decreaseStockOnOrder: ${error.message}`);
    }
};

const increaseStockOnCancellation = async (orderItems, orderId) => {
    try {
        for (const item of orderItems) {
            const productId = item.product.id;
            const size = item.selectedSize;
            const color = item.selectedColor.name;
            const quantity = item.quantity;

            // 1. Update Product Model embedded variants
            const product = await ProductModel.findOne({ id: productId });
            if (product && product.variants) {
                const variant = product.variants.find(v => v.color === color && v.size === size);
                if (variant) {
                    variant.stock = variant.stock + quantity;
                    product.markModified('variants');
                    product.soldQuantity = Math.max(0, (product.soldQuantity || 0) - quantity);
                    await product.save();
                }
            }

            // 2. Update ProductVariant Model
            const pVariant = await ProductVariantModel.findOneAndUpdate(
                { product_id: productId, size_id: size, color_id: color },
                { $inc: { stock: quantity } },
                { new: true }
            );

            // 3. Create inventory log
            const logId = `inv-log-${Math.random().toString(36).substr(2, 9)}`;
            const invLog = new InventoryHistoryModel({
                id: logId,
                variant_id: pVariant ? pVariant.id : `variant-${productId}-${color.toLowerCase()}-${size.toLowerCase()}`,
                type: 'import',
                quantity: quantity,
                note: `Hoàn kho tự động do Hủy Đơn hàng #${orderId}`,
                created_at: new Date().toISOString()
            });
            await invLog.save();
        }
        log(`Stock restored automatically for cancelled order: ${orderId}`);
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
    try {
        log('--- NEW ORDER REQUEST ---');
        const body = req.body;
        log('Body received: ' + JSON.stringify(body).substring(0, 100) + '...');

        const orderId = body.id || `LF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        log('New Order ID: ' + orderId);

        const newOrderData = {
            ...body,
            id: orderId,
            status: 'pending',
            finalAmount: body.finalAmount ?? body.totalAmount,
            createdAt: new Date().toISOString()
        };

        log('Saving order to MongoDB...');
        const newOrder = new OrderModel(newOrderData);
        await newOrder.save();
        log('Save successful. Now decreasing stock.');

        // Decrease Stock
        if (newOrderData.items && newOrderData.items.length > 0) {
            await decreaseStockOnOrder(newOrderData.items, orderId);
        }

        // Giảm usage_limit của coupon nếu có dùng
        if (newOrderData.couponCode) {
            await CouponModel.findOneAndUpdate(
                { code: newOrderData.couponCode },
                { $inc: { usage_limit: -1 } }
            ).catch(e => log('Coupon decrement error: ' + e.message));
        }

        // Gửi email xác nhận bất đồng bộ (Non-blocking)
        sendOrderConfirmationEmail(newOrderData);

        log('Sending success response to client.');
        return res.json({ success: true, orderId: newOrderData.id });
    } catch (error) {
        log('CRITICAL error: ' + error.message);
        log('Error stack: ' + (error.stack || ''));
        if (error.name === 'ValidationError') {
            log('Validation errors: ' + JSON.stringify(error.errors));
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
        }
        next(error);
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

        // Nếu chuyển trạng thái sang cancelled và trạng thái trước đó chưa phải cancelled
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            if (updatedOrder.items && updatedOrder.items.length > 0) {
                await increaseStockOnCancellation(updatedOrder.items, id);
            }
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công', order: updatedOrder });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrders,
    createOrder,
    updateOrderStatus
};
