const nodemailer = require('nodemailer');
const { formatPrice } = require('../utils');
const fs = require('fs');
const path = require('path');

function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(path.join(process.cwd(), 'backend_debug.log'), `[${timestamp}] [EmailService] ${msg}\n`);
    console.log(`[EmailService] ${msg}`);
}

// Create a function to get transporter to ensure env vars are loaded
function getTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

function generateOrderEmailHTML(data) {
    const { orderId, customerName, items, totalAmount, paymentMethod, address, phone, orderDate, note } = data;

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
  <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 8px; text-transform: uppercase;">PH Store</h1>
      <p style="margin: 8px 0 0; color: #cccccc; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Premium Fashion Store</p>
    </div>
    <div style="padding: 40px 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
      <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 32px; line-height: 64px;">✓</span>
      </div>
      <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Cảm ơn bạn, ${customerName}!</h2>
      <p style="margin: 12px 0 0; color: #666; font-size: 15px; line-height: 1.6;">
        Đơn hàng của bạn đã được xác nhận thành công.<br/>
        Chúng tôi sẽ liên hệ bạn sớm nhất để xác nhận giao hàng.
      </p>
    </div>
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
      </table>
    </div>
    <div style="padding: 24px 32px; border-bottom: 1px solid #f0f0f0;">
      <h3 style="margin: 0 0 16px; font-size: 16px; color: #1a1a1a; text-transform: uppercase; font-weight: 600;">Thông tin đơn hàng</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 50%;">
            <span style="color: #888; font-size: 13px; display: block; margin-bottom: 4px;">Người nhận</span>
            <span style="color: #1a1a1a; font-weight: 500; font-size: 14px; display: block;">${customerName}</span>
            <span style="color: #1a1a1a; font-size: 14px; display: block; margin-top: 4px;">${phone}</span>
          </td>
          <td style="padding: 8px 0; vertical-align: top; width: 50%;">
            <span style="color: #888; font-size: 13px; display: block; margin-bottom: 4px;">Phương thức thanh toán</span>
            <span style="color: #1a1a1a; font-weight: 500; font-size: 14px; display: block;">${paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : (paymentMethod === 'bank-transfer' ? 'Chuyển khoản ngân hàng' : paymentMethod)}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 16px 0 8px; vertical-align: top;">
            <span style="color: #888; font-size: 13px; display: block; margin-bottom: 4px;">Địa chỉ giao hàng</span>
            <span style="color: #1a1a1a; font-size: 14px; display: block; line-height: 1.5;">${address}</span>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 24px 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 12px; text-align: left; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #1a1a1a;">Sản phẩm</th>
            <th style="padding: 12px; text-align: center; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #1a1a1a;">SL</th>
            <th style="padding: 12px; text-align: right; color: #888; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #1a1a1a;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>
    <div style="padding: 20px 32px; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0 8px; color: #fff; font-size: 18px; font-weight: 700;">TỔNG CỘNG</td>
          <td style="padding: 12px 0 8px; text-align: right; color: #fff; font-size: 22px; font-weight: 700;">${formatPrice(totalAmount)}</td>
        </tr>
      </table>
    </div>
    ${note ? `
    <div style="padding: 24px 32px; border-bottom: 1px solid #f0f0f0;">
      <h3 style="margin: 0 0 8px; font-size: 14px; color: #1a1a1a; text-transform: uppercase; font-weight: 600;">Ghi chú của khách hàng</h3>
      <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">${note}</p>
    </div>
    ` : ''}
    <div style="padding: 24px 32px; background-color: #fafafa; text-align: center;">
      <p style="margin: 0 0 8px; color: #888; font-size: 13px;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ:</p>
      <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 14px; font-weight: 500;">Email: support@phstore.vn | Hotline: 1900 xxxx</p>
      <p style="margin: 0; color: #bbb; font-size: 12px;">© ${new Date().getFullYear()} PH Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function sendOrderConfirmationEmail(orderData) {
    log('Generating email HTML...');
    const emailHtml = generateOrderEmailHTML({
        ...orderData,
        orderId: orderData.id,
        orderDate: new Date(orderData.createdAt).toLocaleString('vi-VN')
    });
    log('Email HTML generated. Sending email asynchronously...');

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'ntphau21@gmail.com';
    getTransporter().sendMail({
        from: `"PH Store" <${process.env.EMAIL_USER}>`,
        to: orderData.email,
        bcc: adminEmail,
        subject: `Xác nhận đơn hàng #${orderData.id} - PH Store`,
        html: emailHtml,
    }).then(() => {
        log('Email sent successfully for order: ' + orderData.id);
    }).catch((e) => {
        log('Email error for order ' + orderData.id + ': ' + e.message);
    });
}

function sendPasswordResetEmail(email, resetUrl) {
    log('Sending password reset email to: ' + email);
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Đặt lại mật khẩu - PH Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f8f8;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase;">PH Store</h1>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 600;">Yêu cầu đặt lại mật khẩu</h2>
      <p style="margin: 0 0 24px; color: #666; font-size: 15px; line-height: 1.6;">
        Chào bạn,<br/><br/>
        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại PH Store.
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
      © 2026 PH Store. Premium Fashion Store.
    </div>
  </div>
</body>
</html>
    `;

    getTransporter().sendMail({
        from: `"PH Store" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Đặt lại mật khẩu tài khoản của bạn - PH Store',
        html: html,
    }).then(() => {
        log('Reset email sent successfully to: ' + email);
    }).catch((e) => {
        log('Reset email error for ' + email + ': ' + e.message);
    });
}

module.exports = {
    sendOrderConfirmationEmail,
    sendPasswordResetEmail
};
