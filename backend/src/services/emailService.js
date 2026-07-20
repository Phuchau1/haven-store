const { Resend } = require('resend');
const { formatPrice } = require('../utils');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [EmailService] ${msg}\n`);
    console.log(`[EmailService] ${msg}`);
}

// Dùng Resend API thay vì SMTP (tránh bị Render chặn port SMTP)
function getResend() {
    return new Resend(process.env.RESEND_API_KEY);
}

function generateOrderEmailHTML(data) {
    const { orderId, customerName, items, totalAmount, finalAmount, discountAmount, couponCode, paymentMethod, address, phone, orderDate, note } = data;
    const paidAmount = finalAmount || totalAmount;

    let paymentMethodText = paymentMethod;
    if (paymentMethod === 'cod') paymentMethodText = 'Thanh toán khi nhận hàng (COD)';
    if (paymentMethod === 'bank-transfer') paymentMethodText = 'Chuyển khoản ngân hàng';
    if (paymentMethod === 'vnpay') paymentMethodText = 'Thanh toán qua VNPay';
    if (paymentMethod === 'momo') paymentMethodText = 'Thanh toán qua Ví MoMo';

    const itemsHTML = items
        .map(
            (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #eaeaea;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 70px; padding-right: 16px;">
                <img src="${item.product.images[0]}" alt="${item.product.name}" 
                     style="width: 70px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #f0f0f0;" />
              </td>
              <td style="vertical-align: middle;">
                <h4 style="margin: 0 0 4px; font-weight: 600; color: #1f2937; font-size: 15px; line-height: 1.4;">${item.product.name}</h4>
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">Phân loại: ${item.selectedSize} / ${item.selectedColor.name}</p>
                <p style="margin: 0; color: #4b5563; font-size: 13px; font-weight: 500;">SL: x${item.quantity}</p>
              </td>
              <td style="vertical-align: middle; text-align: right;">
                <p style="margin: 0; font-weight: 600; color: #111827; font-size: 15px;">${formatPrice(item.product.price * item.quantity)}</p>
              </td>
            </tr>
          </table>
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
  <title>Xác nhận đơn hàng - Haven Store</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 2px;">HAVEN STORE</h1>
              <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 14px; font-weight: 400; letter-spacing: 1px;">Premium Fashion Collection</p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 40px 32px 24px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; line-height: 64px; margin-bottom: 20px;">
                <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Success" style="width: 32px; vertical-align: middle;" />
              </div>
              <h2 style="margin: 0 0 12px; color: #111827; font-size: 24px; font-weight: 700;">Cảm ơn bạn đã đặt hàng!</h2>
              <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Xin chào <span style="font-weight: 600; color: #374151;">${customerName}</span>,<br/>
                Đơn hàng của bạn đã được xác nhận và đang được chúng tôi xử lý.
              </p>
            </td>
          </tr>

          <!-- Order Info Grid -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="width: 50%; padding-bottom: 20px;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Mã đơn hàng</p>
                    <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 700;">#${orderId}</p>
                  </td>
                  <td style="width: 50%; padding-bottom: 20px;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Ngày đặt hàng</p>
                    <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">${orderDate}</p>
                  </td>
                </tr>
                <tr>
                  <td colspan="2">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Phương thức thanh toán</p>
                    <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 500;">
                      ${paymentMethodText}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #111827; font-weight: 700;">Giao hàng đến</h3>
              <p style="margin: 0 0 4px; font-size: 15px; color: #374151; font-weight: 600;">${customerName} &middot; ${phone}</p>
              <p style="margin: 0; font-size: 15px; color: #6b7280; line-height: 1.5;">${address}</p>
            </td>
          </tr>

          <!-- Items Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Items List -->
          <tr>
            <td style="padding: 24px 32px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #111827; font-weight: 700;">Chi tiết sản phẩm</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHTML}
              </table>
            </td>
          </tr>

          <!-- Totals Area -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; padding: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 15px;">Tạm tính</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 15px; font-weight: 500;">${formatPrice(totalAmount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 15px;">Phí vận chuyển</td>
                  <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 15px; font-weight: 500;">Miễn phí</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #059669; font-size: 15px;">Mã giảm giá (${couponCode})</td>
                  <td style="padding: 8px 0; text-align: right; color: #059669; font-size: 15px; font-weight: 600;">-${formatPrice(discountAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding: 16px 0 0;">
                    <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 16px;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="color: #111827; font-size: 18px; font-weight: 700;">Tổng cộng</td>
                  <td style="text-align: right; color: #4f46e5; font-size: 22px; font-weight: 800;">${formatPrice(paidAmount)}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${note ? `
          <!-- Note -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 4px; font-size: 13px; color: #92400e; font-weight: 700;">Ghi chú đơn hàng:</p>
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">${note}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 32px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 12px; color: #d1d5db; font-size: 14px;">Nếu bạn có bất kỳ thắc mắc nào, hãy liên hệ với chúng tôi</p>
              <div style="margin-bottom: 24px;">
                <a href="mailto:support@phstore.vn" style="color: #60a5fa; text-decoration: none; font-size: 14px; font-weight: 600; margin: 0 12px;">support@phstore.vn</a>
                <span style="color: #4b5563;">|</span>
                <span style="color: #60a5fa; font-size: 14px; font-weight: 600; margin: 0 12px;">1900 1234</span>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">&copy; ${new Date().getFullYear()} Haven Store. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

async function sendOrderConfirmationEmail(orderData) {
    log('=== BẮT ĐẦU GỬI EMAIL ĐƠN HÀNG ===');
    log('Order ID: ' + orderData.id);
    log('Customer Email: ' + orderData.email);
    log('EMAIL_USER env: ' + (process.env.EMAIL_USER || 'CHƯA SET'));
    log('EMAIL_PASS env: ' + (process.env.EMAIL_PASS ? 'ĐÃ SET (' + process.env.EMAIL_PASS.length + ' ký tự)' : 'CHƯA SET'));

    if (!process.env.RESEND_API_KEY) {
        log('LỖI: Chưa cấu hình RESEND_API_KEY trong biến môi trường!');
        return;
    }

    const emailHtml = generateOrderEmailHTML({
        ...orderData,
        orderId: orderData.id,
        orderDate: new Date(orderData.createdAt).toLocaleString('vi-VN')
    });
    log('HTML email đã được tạo. Bắt đầu gửi qua Resend API...');

    const resend = getResend();
    const adminEmail = 'ntphau21@gmail.com';

    // Gửi email cho KHÁCH HÀNG
    try {
        const { error } = await resend.emails.send({
            from: 'Haven Store <onboarding@resend.dev>',
            to: [orderData.email],
            subject: `✅ Xác nhận đơn hàng #${orderData.id} - Haven Store`,
            html: emailHtml,
        });
        if (error) throw new Error(JSON.stringify(error));
        log('✅ Gửi email cho KHÁCH HÀNG thành công: ' + orderData.email);
    } catch (e) {
        log('❌ LỖI gửi email cho khách hàng ' + orderData.email + ': ' + e.message);
    }

    // Gửi email thông báo cho ADMIN
    try {
        const { error } = await resend.emails.send({
            from: 'Haven Store <onboarding@resend.dev>',
            to: [adminEmail],
            subject: `🛒 [Admin] Đơn hàng mới #${orderData.id} - ${orderData.customerName}`,
            html: emailHtml,
        });
        if (error) throw new Error(JSON.stringify(error));
        log('✅ Gửi email cho ADMIN thành công: ' + adminEmail);
    } catch (e) {
        log('❌ LỖI gửi email cho admin ' + adminEmail + ': ' + e.message);
    }

    log('=== KẾT THÚC GỬI EMAIL ===');
}


function sendPasswordResetEmail(email, resetUrl) {
    log('Sending password reset email to: ' + email);
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Đặt lại mật khẩu - Haven Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f8f8;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase;">Haven Store</h1>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Yêu cầu đặt lại mật khẩu</h2>
      <p style="margin: 0 0 24px; color: #666; font-size: 15px; line-height: 1.6;">
        Chào bạn,<br/><br/>
        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Haven Store.
        Vui lòng click vào nút bên dưới để tiến hành đặt mật khẩu mới (Liên kết này có hiệu lực trong vòng 1 giờ):
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; letter-spacing: 1px; text-transform: uppercase;">Đặt lại mật khẩu</a>
      </div>
      <p style="margin: 24px 0 0; color: #888; font-size: 13px; line-height: 1.6;">
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ vẫn được giữ an toàn.
      </p>
    </div>
    <div style="padding: 24px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center; color: #999; font-size: 12px;">
      © 2026 Haven Store. Premium Fashion Store.
    </div>
  </div>
</body>
</html>
    `;

    getTransporter().sendMail({
        from: `"Haven Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Đặt lại mật khẩu tài khoản của bạn - Haven Store',
        html: html,
    }).then(() => {
        log('Reset email sent successfully to: ' + email);
    }).catch((e) => {
        log('Reset email error for ' + email + ': ' + e.message);
    });
}

function sendOtpEmail(email, otp) {
    log('Sending OTP email to: ' + email);

    const plainText = `Xin chào,\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${email}.\n\nMã xác nhận của bạn là: ${otp}\n\nMã này có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.\nNếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.\n\nTrân trọng,\nHaven Store`;

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px 0;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="padding: 40px 30px 30px;">
          <h2 style="color: #333333; margin-top: 0; font-size: 22px; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
          <p style="color: #555555; line-height: 1.6; font-size: 15px; margin-top: 20px;">Xin chào,</p>
          <p style="color: #555555; line-height: 1.6; font-size: 15px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.</p>
          <p style="color: #555555; line-height: 1.6; font-size: 15px;">Mã xác nhận của bạn là:</p>
          <div style="text-align: center; margin: 35px 0;">
            <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111111; background-color: #f8f9fa; padding: 18px 36px; border: 2px dashed #dddddd; border-radius: 8px;">${otp}</span>
          </div>
          <p style="color: #888888; font-size: 14px; text-align: center; margin-bottom: 8px;">Mã này có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này.</p>
          <p style="color: #888888; font-size: 14px; text-align: center; margin-top: 0;">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
        <div style="background-color: #fafafa; padding: 18px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Haven Store. All rights reserved.</p>
        </div>
      </div>
    </div>
    `;

    getTransporter().sendMail({
        from: `"Haven Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `[Haven Store] Mã xác nhận đặt lại mật khẩu: ${otp}`,
        text: plainText,
        html: html,
    }).then(() => {
        log('OTP email sent successfully to: ' + email);
    }).catch((e) => {
        log('OTP email error for ' + email + ': ' + e.message);
    });
}

module.exports = {
    sendOrderConfirmationEmail,
    sendPasswordResetEmail,
    sendOtpEmail
};
