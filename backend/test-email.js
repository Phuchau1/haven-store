require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***loaded (length: ' + process.env.EMAIL_PASS.length + ')' : 'MISSING!');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function testMail() {
    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection OK! Sending test email...');

        let info = await transporter.sendMail({
            from: '"PH Store" <' + process.env.EMAIL_USER + '>',
            to: process.env.EMAIL_USER,
            subject: "✅ Test Email - PH Store hoạt động!",
            html: "<h2>Chúc mừng!</h2><p>Hệ thống gửi email của PH Store đã hoạt động thành công.</p>",
        });
        console.log("✅ Email sent successfully! MessageId:", info.messageId);
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testMail();
