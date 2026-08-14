const { GoogleGenerativeAI } = require('@google/generative-ai');

// ────────────────────────────────────────────────────────────
// AI CHAT - HỎI GIÁ SẢN PHẨM
// POST /api/ai/chat
// Body: { message: "áo polo giá bao nhiêu?" }
// ────────────────────────────────────────────────────────────
exports.chatPriceQuery = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Thiếu nội dung câu hỏi' });
        }

        // Lấy danh sách sản phẩm kèm giá từ DB
        let { ProductModel } = require('../models/Product');
        const products = await ProductModel.find(
            { status: { $ne: 'draft' }, inStock: { $ne: false } }
        ).select('id name price originalPrice category subCategory flashSale flashSalePrice images slug').lean();

        // Tạo bảng giá ngắn gọn để nhúng vào prompt
        const priceList = products.map(p => {
            const discount = p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
            const flashNote = p.flashSale && p.flashSalePrice
                ? ` | ⚡ Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            return `- ${p.name}: ${p.price.toLocaleString('vi-VN')}đ${discount > 0 ? ` (giảm ${discount}%, gốc ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${flashNote} [${p.category}]`;
        }).join('\n');

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        let reply = '';

        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `Bạn là trợ lý tư vấn bán hàng thân thiện của cửa hàng thời trang nam cao cấp HAVEN.
Nhiệm vụ: Trả lời câu hỏi của khách hàng về GIÁ SẢN PHẨM một cách ngắn gọn, lịch thiệp và chuyên nghiệp.

DANH SÁCH SẢN PHẨM & GIÁ HIỆN TẠI CỦA HAVEN:
${priceList}

LINK WEB: https://havenstore.io.vn

CÂU HỎI KHÁCH HÀNG: "${message}"

Hướng dẫn:
- Chỉ trả lời dựa trên danh sách giá trên, không bịa đặt.
- Nếu tìm thấy sản phẩm phù hợp, liệt kê tên + giá + link (https://havenstore.io.vn/product/[slug nếu có]).
- Nếu sản phẩm đang Flash Sale, hãy nhấn mạnh.
- Nếu không tìm thấy sản phẩm phù hợp, hãy gợi ý khách xem toàn bộ sản phẩm tại https://havenstore.io.vn/products.
- Viết bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 5 dòng).`;

            const result = await model.generateContent(prompt);
            reply = result.response.text().trim();
        } else {
            // Fallback: tìm sản phẩm theo từ khóa đơn giản
            const keyword = message.toLowerCase();
            const matched = products.filter(p =>
                p.name.toLowerCase().includes(keyword) ||
                (p.category && p.category.toLowerCase().includes(keyword)) ||
                (p.subCategory && p.subCategory.toLowerCase().includes(keyword))
            ).slice(0, 5);

            if (matched.length > 0) {
                reply = 'Dạ, HAVEN có các sản phẩm phù hợp:\n' + matched.map(p =>
                    `• ${p.name}: ${p.price.toLocaleString('vi-VN')}đ`
                ).join('\n') + '\nBạn có thể xem thêm tại havenstore.io.vn ạ!';
            } else {
                reply = 'Xin chào! Bạn có thể xem toàn bộ sản phẩm và giá tại https://havenstore.io.vn/products ạ. HAVEN luôn có nhiều ưu đãi hấp dẫn!';
            }
        }

        return res.json({ success: true, reply });

    } catch (error) {
        console.error('[AI Chat] Error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi xử lý câu hỏi' });
    }
};
