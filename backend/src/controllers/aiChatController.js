const { GoogleGenerativeAI } = require('@google/generative-ai');

// ────────────────────────────────────────────────────────────
// UNIVERSAL SEARCH ENGINE & SMART FALLBACK
// Đảm bảo tìm bất kỳ tên sản phẩm, danh mục, thương hiệu hay nhu cầu nào
// ────────────────────────────────────────────────────────────
const removeAccents = (str) => {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
};

const STORE_POLICIES = {
    shipping: `🚚 **Chính sách vận chuyển HAVEN:**\n• **Miễn phí vận chuyển (Freeship)** toàn quốc cho đơn hàng từ **500.000đ** trở lên.\n• Giao hàng nhanh 2 - 4 ngày làm việc.\n• Khách hàng được đồng kiểm, kiểm tra hàng trước khi thanh toán (COD).`,
    returns: `🔄 **Chính sách đổi trả:**\n• Đổi trả miễn phí trong vòng **30 ngày** (kể từ ngày nhận hàng).\n• Không cần lý do, hỗ trợ đổi size/mẫu nhanh chóng.\n• Sản phẩm giữ nguyên tem mác, chưa qua giặt tẩy.`,
    payment: `💳 **Phương thức thanh toán:**\n• Thanh toán khi nhận hàng (COD).\n• Ví điện tử MoMo.\n• Cổng thanh toán trực tuyến VNPay.\n• Chuyển khoản ngân hàng.`,
};

const doSmartSearchAndFallback = (rawMessage, products) => {
    // 1. Chuẩn hóa câu hỏi, gỡ bỏ emoji và dấu câu
    const cleanQ = rawMessage.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    const unaccentedQ = removeAccents(cleanQ);

    // 2. Hỏi về chính sách Freeship / Vận chuyển
    if (/ship|v[aậ]n chuy[eể]n|giao h[aà]ng|ph[ií]|free\s*ship/i.test(rawMessage)) {
        return STORE_POLICIES.shipping + '\n\nKhám phá thêm sản phẩm tại https://havenstore.io.vn/products nhé! ✨';
    }

    // 3. Hỏi về Đổi trả / Bảo hành
    if (/đ[oổ]i tr[aả]|b[aả]o h[aà]nh|ho[aà]n ti[eề]n|tr[aả] h[aà]ng/i.test(rawMessage)) {
        return STORE_POLICIES.returns + '\n\nCần hỗ trợ đổi hàng bạn cứ nhắn tin cho shop nha! 🛍️';
    }

    // 4. Hỏi về Thanh toán
    if (/thanh to[aá]n|momo|vnpay|cod|chuy[eể]n kho[aả]n/i.test(rawMessage)) {
        return STORE_POLICIES.payment + '\n\nXem thêm sản phẩm tại https://havenstore.io.vn/products nha!';
    }

    // 5. Phát hiện giới tính câu hỏi (Nam / Nữ) để lọc chính xác 100%
    const isMenQuery = /\b(nam|men|boy|trai|quy ong|dan ong)\b/i.test(unaccentedQ);
    const isWomenQuery = /\b(nu|women|girl|gai|quy co|phu nu|dam|vay|croptop|chan vay)\b/i.test(unaccentedQ);

    let candidateProducts = products;
    if (isMenQuery && !isWomenQuery) {
        candidateProducts = products.filter(p => {
            const text = removeAccents(`${p.name} ${p.category} ${p.categoryLabel} ${p.subCategory} ${p.subCategoryLabel}`);
            const isExplicitlyFemale = text.includes('nu') || text.includes('dam') || text.includes('vay') || text.includes('croptop') || text.includes('womens');
            return !isExplicitlyFemale;
        });
    } else if (isWomenQuery && !isMenQuery) {
        candidateProducts = products.filter(p => {
            const text = removeAccents(`${p.name} ${p.category} ${p.categoryLabel} ${p.subCategory} ${p.subCategoryLabel}`);
            const isFemale = text.includes('nu') || text.includes('dam') || text.includes('vay') || text.includes('croptop') || text.includes('womens') || p.category === 'cat-womens';
            return isFemale;
        });
    }

    // 6. Phát hiện ngưỡng giá từ câu hỏi
    const underMatch = rawMessage.match(/dưới\s*([\d.,]+)\s*k?/i);
    const overMatch  = rawMessage.match(/trên\s*([\d.,]+)\s*k?/i);

    const toNum = (m) => {
        const n = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        return (m[0].toLowerCase().includes('k') || n < 1000) ? n * 1000 : n;
    };
    const maxPrice = underMatch ? toNum(underMatch) : null;
    const minPrice = overMatch  ? toNum(overMatch)  : null;

    let matched = [];
    let titlePrefix = '';

    // A. Hỏi Đánh giá cao nhất / Rating / 5 sao
    if (/danh gia|rating|tot nhat|5 sao|review|sao/i.test(unaccentedQ)) {
        matched = [...candidateProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0)).slice(0, 5);
        titlePrefix = `⭐ Các sản phẩm **được đánh giá cao & nhận nhiều 5 sao nhất** tại HAVEN:`;
    }
    // B. Hỏi Bán chạy nhất / Hot / Best seller
    else if (/ban chay|hot|pho bien|best seller|ua chuong/i.test(unaccentedQ)) {
        matched = [...candidateProducts].sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0) || (b.rating || 0) - (a.rating || 0)).slice(0, 5);
        titlePrefix = `🔥 Danh sách các mẫu **bán chạy & được săn đón nhiều nhất** tại HAVEN:`;
    }
    // C. Hỏi Hàng Mới Nhất
    else if (/moi nhat|new arrival|hang moi|bo suu tap moi/i.test(unaccentedQ)) {
        matched = [...candidateProducts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
        titlePrefix = `✨ Bộ sưu tập **hàng mới về (New Arrivals)** tại HAVEN:`;
    }
    // D. Hỏi Sale / Flash Sale / Giảm giá
    else if (/sale|gi[aả]m gi[aá]|khuy[eê]n m[aã]i|flash|u[uư] [dđ][aã]i/i.test(rawMessage)) {
        matched = candidateProducts.filter(p => p.flashSale || (p.originalPrice && p.originalPrice > p.price))
            .sort((a, b) => {
                const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
                const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
                return discB - discA;
            }).slice(0, 6);
        titlePrefix = `🔥 HAVEN đang có **${matched.length} sản phẩm ưu đãi giảm giá & Flash Sale** cực hời nè bạn:`;
    }
    // E. Hỏi lọc theo Khoảng Giá
    else if (maxPrice) {
        matched = candidateProducts.filter(p => {
            const eff = (p.flashSale && p.flashSalePrice) ? p.flashSalePrice : p.price;
            return eff <= maxPrice;
        }).sort((a, b) => a.price - b.price).slice(0, 6);
        titlePrefix = `💰 Gợi ý các mẫu giá dưới **${maxPrice.toLocaleString('vi-VN')}đ** đang có sẵn:`;
    } else if (minPrice) {
        matched = candidateProducts.filter(p => p.price >= minPrice).sort((a, b) => a.price - b.price).slice(0, 6);
        titlePrefix = `💎 Các dòng sản phẩm cao cấp từ **${minPrice.toLocaleString('vi-VN')}đ** dành cho bạn:`;
    }
    // F. Tìm kiếm Universal theo Tên sản phẩm, Thương hiệu, Danh mục, Từ khóa
    else {
        const stopWords = ['tim', 'cho', 'minh', 'toi', 'ban', 'co', 'khong', 'nhe', 'a', 'san', 'pham', 'mau', 'hang', 'loai', 'muon', 'xem', 'hoi', 'mua', 'can'];
        const tokens = unaccentedQ.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

        matched = candidateProducts.map(p => {
            const pName = removeAccents(p.name);
            const pCat = removeAccents(p.categoryLabel || p.category);
            const pSub = removeAccents(p.subCategoryLabel || p.subCategory);
            const pBrand = removeAccents(p.brand);
            const pDesc = removeAccents(p.description);

            let score = 0;
            if (pName.includes(unaccentedQ)) score += 100;
            if (pBrand && pBrand.includes(unaccentedQ)) score += 80;
            if (pSub && pSub.includes(unaccentedQ)) score += 60;
            if (pCat && pCat.includes(unaccentedQ)) score += 40;

            tokens.forEach(tok => {
                if (pName.includes(tok)) score += 25;
                if (pBrand && pBrand.includes(tok)) score += 15;
                if (pSub && pSub.includes(tok)) score += 10;
                if (pCat && pCat.includes(tok)) score += 8;
                if (pDesc && pDesc.includes(tok)) score += 3;
            });

            return { product: p, score };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.product)
          .slice(0, 6);

        titlePrefix = `Mời bạn tham khảo **${matched.length} sản phẩm** phù hợp nhất tại HAVEN:`;
    }

    // Định dạng kết quả trả về
    if (matched.length > 0) {
        const items = matched.map(p => {
            const discount = p.originalPrice && p.originalPrice > p.price
                ? ` (Giảm ${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%)`
                : '';
            const flash = (p.flashSale && p.flashSalePrice)
                ? ` | ⚡ Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const ratingStr = p.rating ? ` [★ ${p.rating}]` : '';
            const link = p.slug ? `\n  👉 https://havenstore.io.vn/product/${p.slug}` : '';
            return `• **${p.name}** — ${p.price.toLocaleString('vi-VN')}đ${discount}${flash}${ratingStr}${link}`;
        }).join('\n\n');

        const suggestIds = matched.slice(0, 6).map(p => p._id).join(',');
        return `${titlePrefix}\n\n${items}\n\nXem thêm toàn bộ tại https://havenstore.io.vn/products nhé! 🌟\nSUGGEST_IDS: ${suggestIds}`;
    }

    return 'HAVEN có đầy đủ bộ sưu tập thời trang Nam & Nữ, Giày dép, Túi xách và Phụ kiện cao cấp. Mời bạn ghé xem tại https://havenstore.io.vn/products nha! 🛍️';
};


// ────────────────────────────────────────────────────────────
// AI CHAT CONTROLLER - GEMINI FLASH VỚI TOÀN BỘ STORE KNOWLEDGE
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
        ).select('_id name price originalPrice category categoryLabel subCategory subCategoryLabel brand rating reviews soldQuantity flashSale flashSalePrice slug description').lean();

        // 2. Tạo danh mục sản phẩm chi tiết cho Gemini
        const productLines = products.map(p => {
            const discount = p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
            const flash = p.flashSale && p.flashSalePrice
                ? ` | ⚡ Flash Sale: ${p.flashSalePrice.toLocaleString('vi-VN')}đ`
                : '';
            const gender = (p.category === 'cat-womens' || /nữ/i.test(p.categoryLabel || '') || /nữ/i.test(p.name || '')) ? 'Nữ' : 'Nam';
            const link = p.slug ? `https://havenstore.io.vn/product/${p.slug}` : 'https://havenstore.io.vn/products';
            const brand = p.brand ? ` | Brand: ${p.brand}` : '';
            const rating = p.rating ? ` | ★${p.rating}` : '';
            return `- ID:${p._id} | [${gender} - ${p.categoryLabel || p.category}] ${p.name}: ${p.price.toLocaleString('vi-VN')}đ${discount > 0 ? ` (giảm ${discount}%, gốc ${p.originalPrice.toLocaleString('vi-VN')}đ)` : ''}${flash}${brand}${rating} | Link: ${link}`;
        }).join('\n');

        const { AISettingModel } = require('../models/AISetting');
        const aiSetting = await AISettingModel.findOne({ type: 'chat' }).lean().catch(() => null);
        const apiKey = (aiSetting?.apiKey && aiSetting.apiKey.trim()) || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        let reply = '';

        if (apiKey) {
            // Danh sách model ưu tiên từ mới nhất
            const modelCandidates = ['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash-latest'];
            let geminiSuccess = false;

            for (const modelName of modelCandidates) {
                if (geminiSuccess) break;
                try {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.9,
                        }
                    });

                    const fullPrompt = `Bạn là HAVEN AI — stylist và chuyên viên tư vấn bán hàng thông minh của thương hiệu thời trang cao cấp HAVEN (havenstore.io.vn).

THÔNG TIN TOÀN DIỆN VỀ CỬA HÀNG HAVEN:
1. THỜI TRANG NAM: Áo sơ mi nam, Áo Polo nam, Áo thun nam, Áo khoác nam, Quần kaki, Quần tây/âu, Quần jean, Quần short, Bộ vest, Giày da nam (Derby), Dép da (Hermès), Ví da, Thắt lưng da, Mũ nón (D-HAT06), Tất vớ.
2. THỜI TRANG NỮ: Đầm liền thân, Đầm Poplin xếp ly, Chân váy, Áo sơ mi nữ, Áo Polo nữ, Áo thun nữ, Áo khoác nữ, Quần jean nữ, Quần tây nữ, Giày cao gót, Túi xách nữ, Túi đeo chéo (Avril Crossbody, Mini Leather).
3. GIÀY DÉP & THƯƠNG HIỆU: Nike Air Force 1, Air Jordan 1 Low G Spiked, Jordan Grind, Dép Hermès Calfskin Chypre & Izmir Sandal.
4. CHÍNH SÁCH STORE:
   - 🚚 Miễn phí vận chuyển (Freeship) toàn quốc cho đơn từ 500.000đ. Giao hàng 2-4 ngày, được kiểm tra hàng trước khi thanh toán (COD).
   - 🔄 Đổi trả miễn phí 30 ngày (không cần lý do, sản phẩm giữ nguyên tem mác).
   - 🛡️ Cam kết 100% hàng chính hãng, chất liệu cao cấp.
   - ⚡ Flash Sale ưu đãi giá sốc cập nhật mỗi ngày.
   - 💳 Thanh toán: COD, MoMo, VNPay, Chuyển khoản ngân hàng.
   - 🌐 Website: https://havenstore.io.vn

DANH SÁCH ${products.length} SẢN PHẨM THỰC TẾ TRONG KHO (CHỈ TƯ VẤN CÁC SẢN PHẨM NÀY, TUYỆT ĐỐI KHÔNG BỊA RA SẢN PHẨM KHÔNG CÓ TRONG DANH SÁCH):
${productLines}

QUY TẮC BẮT BUỘC:
- Nếu khách hỏi đồ NAM (áo sơ mi nam, áo thun nam, quần nam...), TUYỆT ĐỐI CHỈ giới thiệu sản phẩm NAM, KHÔNG ĐƯỢC đưa sản phẩm Nữ (váy, đầm, áo croptop, sơ mi nữ).
- Nếu khách hỏi đồ NỮ (áo sơ mi nữ, đầm, váy, croptop...), TUYỆT ĐỐI CHỈ giới thiệu sản phẩm NỮ.
- Trả lời bằng tiếng Việt tự nhiên, thân thiện. Xưng "mình", gọi khách là "bạn".
- Khi tư vấn sản phẩm, hãy gợi ý từ 4 đến 6 sản phẩm phù hợp nhất, và ở DÒNG CUỐI CÙNG của câu trả lời BẮT BUỘC ghi cú pháp: SUGGEST_IDS: id1,id2,id3,id4,id5,id6 (dùng đúng ID sản phẩm từ danh sách trên) để website hiển thị thẻ sản phẩm tương tác cho khách hàng.
- Tối đa 150 từ mỗi câu trả lời.

CÂU HỎI CỦA KHÁCH: ${message.trim()}`;

                    const result = await model.generateContent(fullPrompt);
                    reply = result.response.text().trim();
                    geminiSuccess = true;
                } catch (apiError) {
                    console.warn(`[AI Chat] Gemini ${modelName} error:`, apiError.message);
                }
            }

            if (!geminiSuccess) {
                reply = doSmartSearchAndFallback(message, products);
            }
        } else {
            reply = doSmartSearchAndFallback(message, products);
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
