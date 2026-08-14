const { GoogleGenerativeAI } = require('@google/generative-ai');

// ────────────────────────────────────────────────────────────
// SMART FALLBACK LOGIC
// ────────────────────────────────────────────────────────────
const doSmartFallback = (message, products) => {
    const q = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const underMatch = message.match(/dưới\s*([\d.,]+)\s*k?/i);
    const overMatch  = message.match(/trên\s*([\d.,]+)\s*k?/i);

    const toNum = (m) => {
        const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        return (m[0].toLowerCase().includes('k') || n < 1000) ? n * 1000 : n;
    };
    const maxPrice = underMatch ? toNum(underMatch) : null;
    const minPrice = overMatch  ? toNum(overMatch)  : null;

    const isFlashSale = /flash|sale|khuy[eê]n m[aã]i|gi[aả]m gi[aá]/i.test(message);

    let matched = products;

    if (isFlashSale) {
        matched = products.filter(p => p.flashSale && p.flashSalePrice);
    } else if (maxPrice) {
        matched = products.filter(p => {
            const eff = (p.flashSale && p.flashSalePrice) ? p.flashSalePrice : p.price;
            return eff <= maxPrice;
        });
    } else if (minPrice) {
        matched = products.filter(p => p.price >= minPrice);
    } else {
        const keyword = q.split(' ').find(w => w.length > 2) || q;
        matched = products.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            (p.category && p.category.toLowerCase().includes(keyword))
        );
    }

    matched = matched.sort((a, b) => a.price - b.price).slice(0, 6);

    if (matched.length > 0) {
        const intro = isFlashSale
            ? `HAVEN đang có **${matched.length} sản phẩm Flash Sale**:\n\n`
            : maxPrice
                ? `Sản phẩm dưới **${maxPrice.toLocaleString('vi-VN')}đ** tại HAVEN:\n\n`
                : `HAVEN có **${matched.length} sản phẩm** phù hợp:\n\n`;

        return intro + matched.map(p => {
            const saleNote = p.flashSale && p.flashSalePrice
                ? ` | Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            return `• **${p.name}** — ${p.price.toLocaleString('vi-VN')}đ${saleNote}`;
        }).join('\n') + '\n\nXem thêm tại https://havenstore.io.vn/products';
    } else {
        return 'Xin lỗi mình chưa tìm thấy sản phẩm phù hợp. Bạn xem tất cả tại https://havenstore.io.vn/products nhé!';
    }
};


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

        const { ProductModel } = require('../models/Product');
        const products = await ProductModel.find(
            { status: { $ne: 'draft' }, inStock: { $ne: false } }
        ).select('name price originalPrice category subCategory flashSale flashSalePrice slug').lean();

        const priceList = products.map(p => {
            const discount = p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
            const flash = p.flashSale && p.flashSalePrice
                ? ` | Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const link = p.slug ? `havenstore.io.vn/product/${p.slug}` : 'havenstore.io.vn/products';
            return `- ${p.name}: ${p.price.toLocaleString('vi-VN')}đ${discount > 0 ? ` (giảm ${discount}%, gốc: ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${flash} [${p.category || 'Khác'}] Link: ${link}`;
        }).join('\n');

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        let reply = '';

        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });

                const geminiHistory = [];
                if (history.length > 0) {
                    history.slice(-8).forEach(m => {
                        geminiHistory.push({
                            role: m.role === 'ai' ? 'model' : 'user',
                            parts: [{ text: m.text }]
                        });
                    });
                }

                const fullPrompt = `Bạn là HAVEN AI — trợ lý tư vấn thời trang nam của cửa hàng HAVEN (havenstore.io.vn).
Nhiệm vụ: Trả lời câu hỏi về giá sản phẩm, phối đồ, Flash Sale một cách ngắn gọn, thân thiện bằng tiếng Việt.
Xưng "mình", gọi khách là "bạn". Tối đa 120 từ. Dùng bullet point. Nếu Flash Sale thì nhấn mạnh.

DANH SÁCH SẢN PHẨM HAVEN:
${priceList}

CÂU HỎI: ${message.trim()}`;

                const chat = model.startChat({ history: geminiHistory });
                const result = await chat.sendMessage(fullPrompt);
                reply = result.response.text().trim();
            } catch (apiError) {
                console.warn('[HAVEN AI Chat] Gemini API overload/error, falling back to smart search:', apiError.message);
                reply = doSmartFallback(message, products);
            }
        } else {
            reply = doSmartFallback(message, products);
        }

        return res.json({ success: true, reply });

    } catch (error) {
        console.error('[HAVEN AI Chat] Critical Error:', error.message, error.stack);
        return res.status(500).json({
            success: false,
            reply: `Xin lỗi, mình gặp sự cố hệ thống. Bạn vui lòng xem sản phẩm tại havenstore.io.vn nhé!`
        });
    }
};
