const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.generateContent = async (req, res) => {
    try {
        const { productName, shortDescription, category } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!productName) {
            return res.status(400).json({ success: false, message: 'Thiếu tên sản phẩm' });
        }

        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Viết bài chi tiết sản phẩm thời trang (định dạng HTML, dùng các thẻ h3, p, ul, li) cho sản phẩm:
Tên: ${productName}
Danh mục: ${category || 'Thời trang'}
Mô tả ngắn: ${shortDescription || ''}
Yêu cầu: Viết hấp dẫn, nêu bật chất liệu, thiết kế, form dáng, và hướng dẫn bảo quản. Không cần dùng thẻ <html> hay <body>, chỉ cần nội dung body. Không sử dụng markdown backticks \`\`\`html.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();
            
            // Clean up backticks if model ignored prompt instructions
            text = text.replace(/```html\n?/g, '').replace(/```/g, '');

            return res.json({ success: true, data: text });
        } else {
            // Fallback mock if no API key
            const mockHtml = `
<h3>Thiết Kế Cổ Điển Kết Hợp Hiện Đại</h3>
<p>Sản phẩm <strong>${productName}</strong> được thiết kế nhằm mang lại sự thoải mái tối đa mà vẫn giữ được nét thanh lịch. Từng đường kim mũi chỉ đều được chăm chút kỹ lưỡng, phù hợp cho cả môi trường công sở lẫn những buổi dạo phố cuối tuần.</p>

<h3>Chất Liệu Cao Cấp</h3>
<p>Sử dụng chất liệu vải tuyển chọn, mềm mại, thoáng mát và thân thiện với làn da. Khả năng thấm hút mồ hôi tốt giúp bạn luôn tự tin trong mọi hoạt động.</p>

<h3>Đặc Điểm Nổi Bật</h3>
<ul>
    <li>Form dáng chuẩn, tôn vinh đường nét cơ thể.</li>
    <li>Độ bền màu cao, không bị phai sau nhiều lần giặt.</li>
    <li>Dễ dàng phối đồ cùng các trang phục và phụ kiện khác.</li>
</ul>

<h3>Hướng Dẫn Bảo Quản</h3>
<ul>
    <li>Giặt máy ở chế độ nhẹ nhàng hoặc giặt tay để giữ form dáng.</li>
    <li>Tránh sử dụng hóa chất tẩy rửa mạnh.</li>
    <li>Phơi ở nơi thoáng mát, tránh ánh nắng trực tiếp gay gắt.</li>
    <li>Ủi ở nhiệt độ thấp hoặc trung bình.</li>
</ul>
            `;
            // Simulate delay
            await new Promise(r => setTimeout(r, 1500));
            return res.json({ success: true, data: mockHtml.trim() });
        }
    } catch (error) {
        console.error('[AI] Generation Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo nội dung bằng AI' });
    }
};
