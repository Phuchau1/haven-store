// ===== EMAIL TEMPLATE CHUYÊN NGHIỆP =====
import { CartItem } from '@/types';
import { formatPrice } from '@/lib/format';

interface EmailData {
  orderId: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  items: CartItem[];
  totalAmount: number;
  orderDate: string;
}

/**
 * Cả hai tên hàm đều được export để tránh lỗi cache của Next.js Turbopack
 */
export function generateOrderEmailHTML(data: EmailData): string {
  const { orderId, customerName, items, totalAmount, paymentMethod, address, phone, orderDate } = data;

  const itemsHTML = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0f0f0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${item.product.images[0]}" alt="${item.product.name}" 
                 style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" />
            <div>
              <p style="margin: 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${item.product.name}</p>
              <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Size: ${item.selectedSize} | Màu: ${item.selectedColor.name}</p>
            </div>
          </div>
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666; font-size: 14px;">
          x${item.quantity}
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #1a1a1a; font-size: 14px;">
          ${formatPrice(item.product.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đơn hàng - PH Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f8f8;">
  
  <!-- Container chính -->
  <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- ===== HEADER ===== -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 8px; text-transform: uppercase;">
        PH Store
      </h1>
      <p style="margin: 8px 0 0; color: #cccccc; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">
        Premium Fashion Store
      </p>
    </div>

    <!-- ===== THANK YOU SECTION ===== -->
    <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 32px; line-height: 64px;">✓</span>
      </div>
      <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
        Cảm ơn bạn, ${customerName}!
      </h2>
      <p style="margin: 12px 0 0; color: #666; font-size: 15px; line-height: 1.6;">
        Đơn hàng của bạn đã được xác nhận thành công.<br/>
        Chúng tôi sẽ liên hệ bạn sớm nhất để xác nhận giao hàng.
      </p>
    </div>

    <!-- ===== ORDER INFO ===== -->
    <div style="padding: 24px 32px; background-color: #fafafa; border-bottom: 1px solid #f0f0f0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #888; font-size: 13px;">Mã đơn hàng</span><br/>
            <span style="color: #1a1a1a; font-weight: 700; font-size: 16px; letter-spacing: 1px;">#${orderId}</span>
          </td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="color: #888; font-size: 13px;">Ngày đặt</span><br/>
            <span style="color: #1a1a1a; font-weight: 500; font-size: 14px;">${orderDate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #888; font-size: 13px;">Thanh toán</span><br/>
            <span style="color: #1a1a1a; font-weight: 500; font-size: 14px;">${paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}</span>
          </td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="color: #888; font-size: 13px;">Số điện thoại</span><br/>
            <span style="color: #1a1a1a; font-weight: 500; font-size: 14px;">${phone}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- ===== SHIPPING ADDRESS ===== -->
    <div style="padding: 20px 32px; border-bottom: 1px solid #f0f0f0;">
      <p style="margin: 0 0 6px; color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Địa chỉ giao hàng</p>
      <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">${address}</p>
    </div>

    <!-- ===== ORDER ITEMS ===== -->
    <div style="padding: 24px 32px;">
      <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Chi tiết đơn hàng
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 12px; text-align: left; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a1a1a;">Sản phẩm</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a1a1a;">SL</th>
            <th style="padding: 12px; text-align: right; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a1a1a;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <!-- ===== TOTAL ===== -->
    <div style="padding: 20px 32px; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #ccc; font-size: 14px;">Tạm tính</td>
          <td style="padding: 8px 0; text-align: right; color: #fff; font-size: 14px;">${formatPrice(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #ccc; font-size: 14px;">Phí vận chuyển</td>
          <td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 14px; font-weight: 600;">MIỄN PHÍ</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 8px; color: #fff; font-size: 18px; font-weight: 700; border-top: 1px solid #555;">TỔNG CỘNG</td>
          <td style="padding: 12px 0 8px; text-align: right; color: #fff; font-size: 22px; font-weight: 700; border-top: 1px solid #555;">${formatPrice(totalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- ===== TRACKING BUTTON ===== -->
    <div style="padding: 32px; text-align: center;">
      <a href="#" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 50px; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
        Theo dõi đơn hàng →
      </a>
      <p style="margin: 16px 0 0; color: #999; font-size: 13px;">
        Bạn sẽ nhận được thông báo khi đơn hàng được giao cho đơn vị vận chuyển.
      </p>
    </div>

    <!-- ===== SUPPORT ===== -->
    <div style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; text-align: center;">
            <p style="margin: 0 0 4px; color: #888; font-size: 12px;">Hotline</p>
            <p style="margin: 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">1900 8888</p>
          </td>
          <td style="padding: 8px; text-align: center; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;">
            <p style="margin: 0 0 4px; color: #888; font-size: 12px;">Email</p>
            <p style="margin: 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">support@phstore.vn</p>
          </td>
          <td style="padding: 8px; text-align: center;">
            <p style="margin: 0 0 4px; color: #888; font-size: 12px;">Giờ làm việc</p>
            <p style="margin: 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">8:00 - 22:00</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- ===== FOOTER ===== -->
    <div style="padding: 24px 32px; text-align: center; background-color: #1a1a1a;">
      <p style="margin: 0; color: #666; font-size: 11px; line-height: 1.8;">
        © 2026 PH Store. All rights reserved.<br/>
        123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh<br/>
        <a href="#" style="color: #888; text-decoration: underline;">Chính sách bảo mật</a> | 
        <a href="#" style="color: #888; text-decoration: underline;">Điều khoản sử dụng</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

export const getEmailTemplate = generateOrderEmailHTML;
