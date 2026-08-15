const { GoogleGenerativeAI } = require('@google/generative-ai');

// ────────────────────────────────────────────────────────────
// SMART FALLBACK LOGIC - XỬ LÝ ĐA DẠNG MỌI CÂU HỎI VỀ WEBSITE
// ────────────────────────────────────────────────────────────
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const STORE_POLICIES = {
    shipping: `🚚 **Chính sách vận chuyển HAVEN:**\n• **Miễn phí vận chuyển (Freeship)** toàn quốc cho đơn hàng từ **500.000đ** trở lên.\n• Giao hàng nhanh từ 2 - 4 ngày làm việc.\n• Khách hàng được kiểm tra hàng trước khi thanh toán (COD).`,
    returns: `🔄 **Chính sách đổi trả:**\n• Đổi trả miễn phí trong vòng **30 ngày** (kể từ khi nhận hàng).\n• Không cần lý do phức tạp, hỗ trợ đổi size/mẫu nhanh chóng.\n• Sản phẩm giữ nguyên tem mác và chưa qua giặt tẩy.`,
    payment: `💳 **Phương thức thanh toán:**\n• Thanh toán khi nhận hàng (COD).\n• Ví điện tử MoMo.\n• Cổng thanh toán trực tuyến VNPay.\n• Chuyển khoản ngân hàng.`,
    brand: `⭐ **HAVEN Fashion — Thời Trang Cao Cấp:**\n• Cam kết 100% sản phẩm chính hãng, chất liệu cao cấp.\n• Cung cấp đầy đủ thời trang Nam & Nữ, Giày dép, Túi xách, Phụ kiện.\n• Địa chỉ website: https://havenstore.io.vn`,
};

const doSmartFallback = (message, products) => {
    const q = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Hỏi về chính sách vận chuyển / Freeship
    if (/ship|v[aậ]n chuy[eể]n|giao h[aà]ng|ph[ií]|free\s*ship/i.test(message)) {
        return STORE_POLICIES.shipping + '\n\nXem thêm sản phẩm tại https://havenstore.io.vn/products nha! 😊';
    }

    // 2. Hỏi về đổi trả / bảo hành
    if (/đ[oổ]i tr[aả]|b[aả]o h[aà]nh|ho[aà]n ti[eề]n|tr[aả] h[aà]ng/i.test(message)) {
        return STORE_POLICIES.returns + '\n\nCần hỗ trợ đổi hàng bạn cứ nhắn tin cho shop nhé! ✨';
    }

    // 3. Hỏi về thanh toán
    if (/thanh to[aá]n|momo|vnpay|cod|chuy[eể]n kho[aả]n/i.test(message)) {
        return STORE_POLICIES.payment + '\n\nXem thêm sản phẩm tại https://havenstore.io.vn/products nhé!';
    }

    // 4. Phát hiện ngưỡng giá từ câu hỏi
    const underMatch = message.match(/dưới\s*([\d.,]+)\s*k?/i);
    const overMatch  = message.match(/trên\s*([\d.,]+)\s*k?/i);

    const toNum = (m) => {
        const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        return (m[0].toLowerCase().includes('k') || n < 1000) ? n * 1000 : n;
    };
    const maxPrice = underMatch ? toNum(underMatch) : null;
    const minPrice = overMatch  ? toNum(overMatch)  : null;

    // 5. Hỏi về Sale / Giảm giá / Khuyến mãi
    const isSale = /sale|gi[aả]m gi[aá]|khuy[eê]n m[aã]i|flash|u[uư] [dđ][aã]i/i.test(message);

    // 6. Hỏi về Thời trang Nữ
    const isWomens = /n[uữ]|v[aá]y|[dđ][aầ]m|ch[aâ]n v[aá]y|t[uú]i x[aá]ch|cao g[oó]t/i.test(message);

    // 7. Hỏi về Thời trang Nam
    const isMens = /nam|polo|s[oơ] mi nam|vest|kaki|gi[aà]y da|d[aâ]y l[uư]ng|v[ií] da/i.test(message);

    let matched = products;

    if (isSale) {
        matched = products.filter(p => p.flashSale || (p.originalPrice && p.originalPrice > p.price));
    } else if (isWomens) {
        matched = products.filter(p =>
            p.category === 'cat-womens' ||
            (p.categoryLabel && /nữ/i.test(p.categoryLabel)) ||
            (p.subCategory && /nu|dam|vay|tui/i.test(p.subCategory)) ||
            /đầm|váy|nữ|túi/i.test(p.name)
        );
    } else if (isMens) {
        matched = products.filter(p =>
            p.category === 'cat-clothing' ||
            (p.categoryLabel && /nam/i.test(p.categoryLabel)) ||
            (p.subCategory && /nam/i.test(p.subCategory)) ||
            /nam/i.test(p.name)
        );
    } else if (maxPrice) {
        matched = products.filter(p => {
            const eff = (p.flashSale && p.flashSalePrice) ? p.flashSalePrice : p.price;
            return eff <= maxPrice;
        });
    } else if (minPrice) {
        matched = products.filter(p => p.price >= minPrice);
    } else {
        const keyword = q.split(' ').find(w => w.length > 2) || q;
        matched = products.filter(p => {
            const pName = (p.name || '').toLowerCase();
            const pCat = (p.category || '').toLowerCase();
            const pCatLabel = (p.categoryLabel || '').toLowerCase();
            const pSub = (p.subCategory || '').toLowerCase();
            return pName.includes(keyword) || pCat.includes(keyword) || pCatLabel.includes(keyword) || pSub.includes(keyword);
        });
    }

    matched = matched.sort((a, b) => a.price - b.price).slice(0, 6);

    if (matched.length > 0) {
        let intro = '';
        if (isSale) {
            intro = `🔥 HAVEN đang có **${matched.length} sản phẩm ưu đãi giảm giá & Flash Sale** cực hời nè bạn:\n\n`;
        } else if (isWomens) {
            intro = `✨ HAVEN có trọn bộ sưu tập **Thời trang Nữ** cực xinh và thanh lịch dành cho bạn đây ạ:\n\n`;
        } else if (isMens) {
            intro = `👔 Bộ sưu tập **Thời trang Nam cao cấp** chuẩn gu tại HAVEN gồm các mẫu:\n\n`;
        } else if (maxPrice) {
            intro = `💰 Gợi ý các mẫu giá dưới **${maxPrice.toLocaleString('vi-VN')}đ** đang bán chạy:\n\n`;
        } else if (minPrice) {
            intro = `💎 Các dòng sản phẩm cao cấp từ **${minPrice.toLocaleString('vi-VN')}đ** dành cho bạn:\n\n`;
        } else {
            intro = `Mời bạn tham khảo **${matched.length} sản phẩm** đúng nhu cầu tại HAVEN nhé:\n\n`;
        }

        const items = matched.map(p => {
            const discount = p.originalPrice > p.price
                ? ` (Giảm ${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%)`
                : '';
            const flash = (p.flashSale && p.flashSalePrice)
                ? ` | ⚡ Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const link = p.slug ? `\n  👉 https://havenstore.io.vn/product/${p.slug}` : '';
            return `• **${p.name}** — ${p.price.toLocaleString('vi-VN')}đ${discount}${flash}${link}`;
        }).join('\n\n');

        const suggestIds = matched.slice(0, 3).map(p => p._id).join(',');
        return intro + items + '\n\nXem thêm toàn bộ tại https://havenstore.io.vn/products nhé! 🌟' + (suggestIds ? `\nSUGGEST_IDS: ${suggestIds}` : '');
    }

    return 'HAVEN có đầy đủ bộ sưu tập thời trang Nam & Nữ, Giày dép và Phụ kiện cao cấp. Mời bạn ghé xem tại https://havenstore.io.vn/products nha! 🛍️';
};


// ────────────────────────────────────────────────────────────
// AI CHAT CONTROLLER - GEMINI 3.7 FLASH VỚI TOÀN BỘ STORE KNOWLEDGE
// POST /api/ai/chat
// Body: { message: "...", history: [{role, text}] }
// ────────────────────────────────────────────────────────────
exports.chatPriceQuery = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu nội dung câu hỏi' });
        }

        // 1. Lấy toàn bộ sản phẩm thực tế từ Database
        const { ProductModel } = require('../models/Product');
        const products = await ProductModel.find(
            { status: { $ne: 'draft' }, inStock: { $ne: false } }
        ).select('_id name price originalPrice category categoryLabel subCategory subCategoryLabel flashSale flashSalePrice slug description').lean();

        // 2. Tạo bản tóm tắt danh mục và giá sản phẩm (RAG Context)
        const productLines = products.map(p => {
            const discount = p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
            const flash = p.flashSale && p.flashSalePrice
                ? ` | ⚡ Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const gender = (p.category === 'cat-womens' || /nữ/i.test(p.categoryLabel || '')) ? 'Nữ' : 'Nam';
            const link = p.slug ? `https://havenstore.io.vn/product/${p.slug}` : 'https://havenstore.io.vn/products';
            return `- ID:${p._id} | [${gender} - ${p.categoryLabel || p.category}] ${p.name}: ${p.price.toLocaleString('vi-VN')}đ${discount > 0 ? ` (giảm ${discount}%, gốc ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${flash} | Link: ${link}`;
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

                const fullPrompt = `Bạn là HAVEN AI — stylist và trợ lý tư vấn bán hàng thông minh của thương hiệu thời trang cao cấp HAVEN (havenstore.io.vn).

THÔNG TIN TOÀN DIỆN VỀ CỬA HÀNG HAVEN:
1. THỜI TRANG NAM: Áo sơ mi nam, Áo Polo nam, Áo thun nam, Áo khoác nam, Quần kaki, Quần tây/âu, Quần jean, Quần short, Bộ vest, Giày da nam, Dép da, Ví da, Thắt lưng da, Mũ nón.
2. THỜI TRANG NỮ: Đầm liền thân, Đầm Poplin xếp ly, Chân váy, Áo sơ mi nữ, Áo Polo nữ, Áo thun nữ, Áo khoác nữ, Quần jean nữ, Quần tây nữ, Giày cao gót, Túi xách nữ, Túi đeo chéo.
3. CHÍNH SÁCH STORE:
   - 🚚 Miễn phí vận chuyển (Freeship) toàn quốc cho đơn từ 500.000đ. Giao hàng 2-4 ngày, được kiểm tra hàng trước khi thanh toán (COD).
   - 🔄 Đổi trả miễn phí 30 ngày (không cần lý do, sản phẩm giữ nguyên tem mác).
   - 🛡️ Cam kết 100% hàng chính hãng, bảo hành chất lượng.
   - ⚡ Flash Sale ưu đãi giá sốc cập nhật mỗi ngày.
   - 💳 Thanh toán: COD, MoMo, VNPay, Chuyển khoản ngân hàng.
   - 🌐 Website chính thức: https://havenstore.io.vn

DANH SÁCH ${products.length} SẢN PHẨM THỰC TẾ TRONG KHO:
${productLines}

QUY TẮC PHẢN HỒI:
- Trả lời bằng tiếng Việt tự nhiên, thân thiện, sáng tạo như stylist chuyên nghiệp. Xưng "mình", gọi khách là "bạn".
- KHÔNG lặp lại một mẫu câu mở đầu cố định. Hãy biến hóa câu chữ đa dạng.
- Khi khách hỏi bất cứ thứ gì về sản phẩm Nam, Nữ, Giá tiền, Sale, Chính sách ship, Đổi trả... hãy trả lời chính xác dựa trên thông tin trên.
- Khi tư vấn sản phẩm cụ thể (1 đến 3 sản phẩm), ở dòng cuối cùng của câu trả lời hãy thêm: SUGGEST_IDS: id1,id2,id3 (dùng ID thật) để web hiển thị thẻ sản phẩm tương tác cho khách.
- Tối đa 150 từ mỗi câu trả lời.

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
