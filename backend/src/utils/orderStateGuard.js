/**
 * ============================================================================
 * ORDER STATE GUARD & ENFORCEMENT RULES (QUY TẮC CHẶN VÀ ĐIỀU ĐỘNG TRẠNG THÁI)
 * ============================================================================
 * Kiểm soát chuyển đổi trạng thái đơn hàng theo 8 nhóm quy trình chuẩn E-commerce.
 */

// Danh sách 8 nhóm trạng thái chuẩn
const STATUS_GROUPS = {
    PENDING: ['pending'],                                      // 1. Chờ bộ phận xử lý
    PACKING: ['confirmed', 'processing', 'waiting_pickup'],     // 2. Xác nhận & Đóng gói
    SHIPPING: ['picked_up', 'in_transit', 'out_for_delivery'],  // 3. Đang vận chuyển
    DELIVERED: ['delivered', 'completed', 'reviewed', 'awaiting_review'], // 4. Giao hàng thành công
    RETURN_REQUESTED: ['return_requested', 'refund_requested', 'dispute'], // 5. Yêu cầu hoàn hàng
    RETURNING: ['returning', 'return_received', 'returned_to_seller'], // 6. Đang hoàn hàng về shop
    REFUNDED: ['refunded'],                                    // 7. Đã hoàn tiền
    CANCELLED: ['cancelled', 'delivery_failed']                 // 8. Hủy đơn hàng
};

/**
 * Kiểm tra xem chuyển trạng thái từ currentStatus -> newStatus có hợp lệ không
 */
const validateStatusTransition = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) return { allowed: true };

    // 1. Nếu đơn đã REFUNDED hoặc CANCELLED -> Trạng thái kết thúc (Terminal state), cấm đổi ngược
    if (currentStatus === 'refunded' || currentStatus === 'cancelled') {
        return {
            allowed: false,
            ruleName: 'RULE_TERMINAL_STATE',
            message: `Hệ thống chặn: Đơn hàng ở trạng thái '${currentStatus}' là trạng thái kết thúc. Không thể chuyển sang '${newStatus}'.`
        };
    }

    // 2. Nếu đơn đã GIAO HÀNG THÀNH CÔNG (delivered) -> Không thể hủy hay chuyển lại shipping/pending
    if (['delivered', 'completed'].includes(currentStatus)) {
        const allowedAfterDelivered = ['return_requested', 'refund_requested', 'dispute', 'reviewed', 'awaiting_review', 'completed'];
        if (!allowedAfterDelivered.includes(newStatus)) {
            return {
                allowed: false,
                ruleName: 'RULE_DELIVERED_LOCK',
                message: `Hệ thống chặn: Đơn hàng đã giao thành công (${currentStatus}). Không thể đổi sang '${newStatus}'. Chỉ được phép yêu cầu hoàn hàng hoặc đánh giá.`
            };
        }
    }

    // 3. Nếu đơn ĐANG VẬN CHUYỂN (in_transit, out_for_delivery) -> Cấm quay ngược về pending/confirmed
    if (['picked_up', 'in_transit', 'out_for_delivery'].includes(currentStatus)) {
        const forbiddenBackwards = ['pending', 'confirmed', 'processing', 'waiting_pickup'];
        if (forbiddenBackwards.includes(newStatus)) {
            return {
                allowed: false,
                ruleName: 'RULE_SHIPPING_BACKWARD_LOCK',
                message: `Hệ thống chặn: Đơn hàng đang trên đường vận chuyển. Cấm quay ngược về trạng thái chuẩn bị/đóng gói.`
            };
        }
    }

    // 4. Nếu đơn YÊU CẦU HOÀN HÀNG (return_requested) -> Cấm nhảy thẳng sang refunded khi chưa nhận lại hàng
    if (['return_requested', 'refund_requested'].includes(currentStatus)) {
        if (newStatus === 'refunded') {
            return {
                allowed: false,
                ruleName: 'RULE_RETURN_BEFORE_REFUND',
                message: `Hệ thống chặn: Cấm bấm hoàn tiền trực tiếp khi shop chưa xác nhận nhận lại hàng trả về kho (phải qua bước Đang hoàn hàng / Đã nhận hàng).`
            };
        }
    }

    // 5. Đơn PENDING (Chờ xử lý) -> Cấm nhảy thẳng sang shipping/delivered khi chưa đóng gói
    if (currentStatus === 'pending') {
        const directToShipping = ['in_transit', 'out_for_delivery', 'delivered'];
        if (directToShipping.includes(newStatus)) {
            return {
                allowed: false,
                ruleName: 'RULE_PENDING_DIRECT_SHIPPING',
                message: `Hệ thống chặn: Đơn hàng chưa xác nhận & đóng gói. Cấm cho đơn đi giao trực tiếp khi chưa qua bộ phận kho.`
            };
        }
    }

    return { allowed: true };
};

module.exports = {
    STATUS_GROUPS,
    validateStatusTransition
};
