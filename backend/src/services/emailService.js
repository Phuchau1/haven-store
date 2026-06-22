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
    const { orderId, customerName, items, totalAmount, finalAmount, discountAmount, couponCode, paymentMethod, address, phone, orderDate, note } = data;
    const paidAmount = finalAmount || totalAmount;

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
  <title>Xác nhận đơn hàng - Haven Store</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f8f8;">
  <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 8px; text-transform: uppercase;">Haven Store</h1>
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
        ${discountAmount > 0 ? `
        <tr>
          <td style="padding: 6px 0; color: #aaa; font-size: 14px;">T\u1ea1m t\u00ednh</td>
          <td style="padding: 6px 0; text-align: right; color: #aaa; font-size: 14px;">${formatPrice(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6ee7b7; font-size: 14px;">\uD83C\uDF9F Voucher (${couponCode})</td>
          <td style="padding: 6px 0; text-align: right; color: #6ee7b7; font-size: 14px;">-${formatPrice(discountAmount)}</td>
        </tr>
        <tr><td colspan="2" style="border-top: 1px solid #444; padding-top: 8px;"></td></tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0 8px; color: #fff; font-size: 18px; font-weight: 700;">T\u1ed4NG C\u1ed8NG</td>
          <td style="padding: 12px 0 8px; text-align: right; color: #fff; font-size: 22px; font-weight: 700;">${formatPrice(paidAmount)}</td>
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
      <p style="margin: 0; color: #bbb; font-size: 12px;">© ${new Date().getFullYear()} Haven Store. All rights reserved.</p>
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
        from: `"Haven Store" <${process.env.EMAIL_USER}>`,
        to: orderData.email,
        bcc: adminEmail,
        subject: `Xác nhận đơn hàng #${orderData.id} - Haven Store`,
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
