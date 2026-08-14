const { GoogleGenerativeAI } = require('@google/generative-ai');

// ────────────────────────────────────────────────────────────
// AI CHAT HOÀN CHỈNH - Trợ lý HAVEN
// POST /api/ai/chat
// Body: { message: "...", history: [{role, text}] }
// ────────────────────────────────────────────────────────────
exports.chatPriceQuery = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu nội dung câu hỏi' });
        }

        // ── 1. Tải dữ liệu sản phẩm từ DB ──────────────────
        const { ProductModel } = require('../models/Product');
        const products = await ProductModel.find(
            { status: { $ne: 'draft' }, inStock: { $ne: false } }
        ).select('name price originalPrice category subCategory flashSale flashSalePrice slug description').lean();

        // ── 2. Build context sản phẩm chi tiết ─────────────
        const productContext = products.map(p => {
            const discount = p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
            const flash = p.flashSale && p.flashSalePrice
                ? `| ⚡ Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const link = p.slug ? `https://havenstore.io.vn/product/${p.slug}` : 'https://havenstore.io.vn/products';
            return [
                `• Tên: ${p.name}`,
                `  Giá: ${p.price.toLocaleString('vi-VN')}đ ${discount > 0 ? `(giảm ${discount}%, giá gốc: ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${flash}`,
                `  Danh mục: ${p.category || ''}${p.subCategory ? ' > ' + p.subCategory : ''}`,
                `  Link: ${link}`
            ].join('\n');
        }).join('\n\n');

        // ── 3. Build lịch sử chat (multi-turn) ─────────────
        const chatHistory = history.slice(-8).map(m => ({
            role: m.role === 'ai' ? 'model' : 'user',
            parts: [{ text: m.text }]
        }));

        // ── 4. System prompt đầy đủ ─────────────────────────
        const SYSTEM_PROMPT = `Bạn là HAVEN AI — trợ lý thời trang thông minh của cửa hàng thời trang nam cao cấp HAVEN.

MỤC TIÊU:
- Tư vấn sản phẩm, giá cả, phong cách thời trang một cách chuyên nghiệp và thân thiện.
- Trả lời mọi câu hỏi liên quan đến sản phẩm, size, cách phối đồ, khuyến mãi, Flash Sale.
- Hướng dẫn khách hàng đến trang sản phẩm phù hợp.

THÔNG TIN STORE:
- Tên: HAVEN — Thời Trang Nam Cao Cấp
- Website: https://havenstore.io.vn
- Xem tất cả sản phẩm: https://havenstore.io.vn/products
- Liên hệ/Đặt hàng: Trực tiếp qua website

DANH SÁCH SẢN PHẨM & GIÁ THỰC TẾ HIỆN TẠI:
${productContext}

HƯỚNG DẪN PHONG CÁCH TRẢ LỜI:
- Xưng hô: "mình" và gọi khách là "bạn" — thân thiện, gần gũi.
- Câu trả lời ngắn gọn, rõ ràng, dễ đọc (dùng bullet point, emoji hợp lý).
- Nếu khách hỏi về size: gợi ý chọn size M/L/XL và hướng dẫn xem bảng size trên trang sản phẩm.
- Nếu hỏi về phối đồ: gợi ý cụ thể dựa trên sản phẩm đang có trong store.
- Nếu hỏi giá: luôn nêu giá chính xác + % giảm nếu có + link sản phẩm.
- Nếu Flash Sale: nhấn mạnh với emoji ⚡ và giá Flash Sale.
- KHÔNG bịa đặt sản phẩm không có trong danh sách.
- Luôn kết thúc bằng lời mời xem thêm hoặc câu hỏi follow-up nếu phù hợp.
- Viết bằng tiếng Việt. Tối đa 150 từ mỗi câu trả lời.`;

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        let reply = '';

        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: SYSTEM_PROMPT,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400,
                }
            });

            const chat = model.startChat({ history: chatHistory });
            const result = await chat.sendMessage(message);
            reply = result.response.text().trim();
        } else {
            // ── Smart fallback (không cần API key) ────────────
            const q = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // Phát hiện ngưỡng giá từ câu hỏi
            const underMatch = message.match(/dưới\s*([\d,.]+)\s*k?/i) || message.match(/under\s*([\d,.]+)/i);
            const overMatch  = message.match(/trên\s*([\d,.]+)\s*k?/i);
            const maxPrice = underMatch ? parseFloat(underMatch[1].replace(/\./g, '').replace(',', '.')) * (underMatch[0].includes('k') || parseInt(underMatch[1]) < 1000 ? 1000 : 1) : null;
            const minPrice = overMatch  ? parseFloat(overMatch[1].replace(/\./g, '').replace(',', '.')) * (overMatch[0].includes('k') || parseInt(overMatch[1]) < 1000 ? 1000 : 1) : null;

            // Flash Sale query
            const isFlashSale = /flash|sale|khuy[eê]n m[aã]i|gi[aả]m gi[aá]/i.test(message);

            let matched = products;

            if (isFlashSale) {
                matched = products.filter(p => p.flashSale && p.flashSalePrice);
            } else if (maxPrice) {
                matched = products.filter(p => {
                    const effectivePrice = (p.flashSale && p.flashSalePrice) ? p.flashSalePrice : p.price;
                    return effectivePrice <= maxPrice;
                });
            } else if (minPrice) {
                matched = products.filter(p => p.price >= minPrice);
            } else {
                // Tìm theo từ khóa tên/danh mục
                matched = products.filter(p =>
                    p.name.toLowerCase().includes(q.split(' ').find((w: string) => w.length > 2) || q) ||
                    (p.category && p.category.toLowerCase().replace(/[\u0300-\u036f]/g, '').normalize('NFD').includes(q))
                );
            }

            matched = matched.sort((a: any, b: any) => a.price - b.price).slice(0, 6);

            if (matched.length > 0) {
                const intro = isFlashSale
                    ? `⚡ HAVEN đang có **${matched.length} sản phẩm Flash Sale**:\n\n`
                    : maxPrice
                        ? `💰 Sản phẩm dưới **${maxPrice.toLocaleString('vi-VN')}đ** tại HAVEN:\n\n`
                        : `HAVEN có **${matched.length} sản phẩm** phù hợp:\n\n`;

                reply = intro + matched.map((p: any) => {
                    const salePrice = (p.flashSale && p.flashSalePrice) ? ` ⚡ Flash: ${p.flashSalePrice.toLocaleString('vi-VN')}đ` : '';
                    const link = p.slug ? `https://havenstore.io.vn/product/${p.slug}` : '';
                    return `• **${p.name}** — ${p.price.toLocaleString('vi-VN')}đ${salePrice}${link ? '\n  👉 ' + link : ''}`;
                }).join('\n\n') + '\n\nXem thêm tại https://havenstore.io.vn/products ạ! 😊';
            } else {
                reply = `Xin lỗi mình chưa tìm thấy sản phẩm phù hợp với yêu cầu đó. Bạn xem toàn bộ sản phẩm tại https://havenstore.io.vn/products để chọn nhé! 🛍️`;
            }
        }

        return res.json({ success: true, reply });

    } catch (error) {
        console.error('[HAVEN AI Chat] Error:', error);
        return res.status(500).json({
            success: false,
            reply: 'Xin lỗi, mình đang gặp sự cố nhỏ. Bạn thử lại sau hoặc liên hệ trực tiếp tại havenstore.io.vn nhé!'
        });
    }
};
