const { GoogleGenerativeAI } = require('@google/generative-ai');

// ────────────────────────────────────────────────────────────
// SMART FALLBACK LOGIC - ĐA DẠNG CÂU TỪ TỰ NHIÊN
// ────────────────────────────────────────────────────────────
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const RANDOM_PRICE_INTROS = [
    (n, max) => `Dưới **${max}đ**, shop có **${n} mẫu** cực đẹp bạn tham khảo nhé:\n\n`,
    (n, max) => `Gợi ý cho bạn **${n} sản phẩm** giá dưới **${max}đ** đang bán chạy tại store:\n\n`,
    (n, max) => `Mình lọc ra **${n} món đồ** trong tầm giá dưới **${max}đ** cho bạn nè:\n\n`,
    (n, max) => `Shop có sẵn các mẫu dưới **${max}đ** rất hợp gu:\n\n`,
];

const RANDOM_OVER_PRICE_INTROS = [
    (n, min) => `Từ **${min}đ** trở lên, shop có các mẫu cao cấp này:\n\n`,
    (n, min) => `Dòng sản phẩm trên **${min}đ** với chất liệu cao cấp dành cho bạn:\n\n`,
];

const RANDOM_FLASH_INTROS = [
    (n) => `⚡ Tin vui! Shop đang có **${n} deal Flash Sale** siêu hời:\n\n`,
    (n) => `🔥 Đang có **${n} sản phẩm giảm giá chớp nhoáng** hôm nay nè bạn:\n\n`,
    (n) => `⚡ Danh sách **${n} mẫu Flash Sale** giá tốt nhất hiện tại:\n\n`,
];

const RANDOM_GENERAL_INTROS = [
    (n) => `Shop có **${n} gợi ý** phù hợp với bạn đây nè:\n\n`,
    (n) => `Mời bạn xem qua **${n} sản phẩm** đúng nhu cầu nhé:\n\n`,
    (n) => `Mình gợi ý cho bạn **${n} mẫu** rất hot tại shop nha:\n\n`,
    (n) => `Dưới đây là **${n} lựa chọn** chất lượng cho bạn:\n\n`,
];

const RANDOM_CLOSINGS = [
    'Xem thêm nhiều mẫu khác tại https://havenstore.io.vn/products nha! ✨',
    'Bạn thích mẫu nào cứ nhắn mình tư vấn size thêm nhé! 🛍️',
    'Cần tư vấn phối đồ hay chọn size thì bảo mình nha! 😊',
    'Khám phá thêm bộ sưu tập đầy đủ tại https://havenstore.io.vn/products nhé! 🌟',
];

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
        let intro = '';
        if (isFlashSale) {
            intro = pickRandom(RANDOM_FLASH_INTROS)(matched.length);
        } else if (maxPrice) {
            intro = pickRandom(RANDOM_PRICE_INTROS)(matched.length, maxPrice.toLocaleString('vi-VN'));
        } else if (minPrice) {
            intro = pickRandom(RANDOM_OVER_PRICE_INTROS)(matched.length, minPrice.toLocaleString('vi-VN'));
        } else {
            intro = pickRandom(RANDOM_GENERAL_INTROS)(matched.length);
        }

        const items = matched.map(p => {
            const saleNote = p.flashSale && p.flashSalePrice
                ? ` | ⚡ Flash: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const link = p.slug ? `\n  👉 https://havenstore.io.vn/product/${p.slug}` : '';
            return `• **${p.name}** — ${p.price.toLocaleString('vi-VN')}đ${saleNote}${link}`;
        }).join('\n\n');

        const suggestIds = matched.slice(0, 3).map(p => p._id).join(',');
        return intro + items + '\n\n' + pickRandom(RANDOM_CLOSINGS) + (suggestIds ? `\nSUGGEST_IDS: ${suggestIds}` : '');
    } else {
        const notFoundList = [
            'Hiện tại mình chưa tìm thấy mẫu nào đúng yêu cầu này. Bạn ghé qua https://havenstore.io.vn/products để xem toàn bộ sản phẩm nhé! 🛍️',
            'Tiếc là mẫu này shop đang tạm hết hoặc chưa có. Bạn xem thêm các mẫu khác tại https://havenstore.io.vn/products nha! 😊',
            'Shop chưa có sản phẩm khớp với từ khóa này. Bạn thử tìm từ khóa khác hoặc lướt xem tại https://havenstore.io.vn/products nhé!',
        ];
        return pickRandom(notFoundList);
    }
};


// ────────────────────────────────────────────────────────────
// AI CHAT HOÀN CHỈNH - Trợ lý Store
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
        ).select('_id name price originalPrice category subCategory flashSale flashSalePrice slug').lean();

        const priceList = products.map(p => {
            const discount = p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
            const flash = p.flashSale && p.flashSalePrice
                ? ` | Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const link = p.slug ? `https://havenstore.io.vn/product/${p.slug}` : 'https://havenstore.io.vn/products';
            return `- ID:${p._id} | ${p.name}: ${p.price.toLocaleString('vi-VN')}đ${discount > 0 ? ` (giảm ${discount}%, gốc: ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${flash} [${p.category || 'Khác'}] Link: ${link}`;
        }).join('\n');

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        let reply = '';

        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: 'gemini-3.7-flash',
                    generationConfig: {
                        temperature: 0.85,
                        topP: 0.95,
                    }
                });

                const geminiHistory = [];
                if (history.length > 0) {
                    history.slice(-8).forEach(m => {
                        geminiHistory.push({
                            role: m.role === 'ai' ? 'model' : 'user',
                            parts: [{ text: m.text }]
                        });
                    });
                }

                const fullPrompt = `Bạn là trợ lý AI stylist và tư vấn bán hàng thời trang nam cao cấp của cửa hàng (havenstore.io.vn).

NGUYÊN TẮC PHẢN HỒI (QUAN TRỌNG):
1. ĐA DẠNG CÂU TỪ: Tuyệt đối KHÔNG lặp lại một câu mở đầu rập khuôn kiểu 'Dạ mình tìm thấy một số sản phẩm...'. Hãy linh hoạt biến đổi câu mở đầu sinh động, tự nhiên như người thật (VD: 'Tầm giá này bên mình có mấy mẫu đỉnh này nè:', 'Gợi ý ngay cho bạn những mẫu hot nhất:', 'Dưới 300k thì các mẫu sau đang được chuộng lắm:', 'Bạn tham khảo vài item này xem sao nhé:',...).
2. PHONG CÁCH: Thân thiện, năng động, am hiểu thời trang. Xưng "mình", gọi khách là "bạn".
3. TRÌNH BÀY: Ngắn gọn (dưới 130 từ), dùng bullet point rõ ràng, ghi kèm giá và link sản phẩm cụ thể.
4. FLASH SALE: Nếu sản phẩm đang Flash Sale thì làm nổi bật bằng icon ⚡.
5. GỢI Ý THẺ SẢN PHẨM: Khi bạn gợi ý từ 1 đến 3 sản phẩm cụ thể, ở dòng cuối cùng của câu trả lời hãy thêm: SUGGEST_IDS: id1,id2,id3 (dùng đúng ID sản phẩm từ danh sách dưới đây) để hệ thống hiển thị thẻ sản phẩm tương tác cho khách.

DANH SÁCH SẢN PHẨM HIỆN CÓ:
${priceList}

CÂU HỎI CỦA KHÁCH: ${message.trim()}`;

                const chat = model.startChat({ history: geminiHistory });
                const result = await chat.sendMessage(fullPrompt);
                reply = result.response.text().trim();
            } catch (apiError) {
                console.warn('[AI Chat] Gemini API error, falling back to smart search:', apiError.message);
                reply = doSmartFallback(message, products);
            }
        } else {
            reply = doSmartFallback(message, products);
        }

        return res.json({ success: true, reply });

    } catch (error) {
        console.error('[AI Chat] Critical Error:', error.message, error.stack);
        return res.status(500).json({
            success: false,
            reply: `Xin lỗi, mình gặp sự cố hệ thống. Bạn vui lòng xem sản phẩm tại https://havenstore.io.vn/products nhé!`
        });
    }
};
