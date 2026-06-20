import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY || '';

// Initialize the Gemini client
function getClient() {
    return new GoogleGenerativeAI(API_KEY);
}

// Text-only generation
export async function generateText(prompt: string): Promise<string> {
    try {
        const genAI = getClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err: unknown) {
        console.error('Gemini text error:', err);
        // fallback response
        return generateFallbackText(prompt);
    }
}

// Vision: text + image
export async function generateWithImage(prompt: string, imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
    try {
        const genAI = getClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const imagePart: Part = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text();
    } catch (err: unknown) {
        console.error('Gemini vision error:', err);
        return generateFallbackVision();
    }
}

// Fallback responses khi API không hoạt động
function generateFallbackText(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('outfit') || lower.includes('phong cách') || lower.includes('style')) {
        return `✨ **Gợi ý phong cách từ AI Stylist PH Store**

Dựa trên sở thích của bạn, đây là những gợi ý phù hợp:

**🎯 Outfit được đề xuất:**
- Áo sơ mi trắng oversized + quần âu đen slim fit = tổ hợp classic không bao giờ lỗi thời
- Layer áo khoác nhẹ bên ngoài để tạo chiều sâu cho trang phục
- Phụ kiện minimal: đồng hồ, giày da đơn sắc

**💡 Lời khuyên:**
- Ưu tiên chất liệu thoáng mát phù hợp khí hậu Việt Nam
- Chọn màu trung tính (trắng, đen, be, xám) để dễ phối
- Đầu tư vào 5-7 items cơ bản thay vì nhiều items trendy

**🛍️ Sản phẩm phù hợp tại PH Store:**
Hãy khám phá bộ sưu tập của chúng tôi để tìm những items phù hợp với phong cách của bạn!`;
    }
    return `Xin lỗi, AI đang bận. Vui lòng thử lại sau ít phút.`;
}

function generateFallbackVision(): string {
    return `👗 **Phân tích từ AI Stylist PH Store**

Dựa trên ảnh của bạn và sản phẩm được chọn:

**✅ Đánh giá phù hợp:**
- Tông màu của sản phẩm phù hợp với vóc dáng tổng thể
- Kiểu dáng tạo sự cân bằng hài hòa

**💡 Lời khuyên mặc:**
- Chọn size phù hợp để sản phẩm tôn dáng tốt nhất
- Mix cùng accessory đơn giản để hoàn thiện look
- Phối cùng giày đơn sắc để tạo sự thanh lịch

**🎨 Gợi ý phối đồ thêm:**
- Thêm belt để tạo điểm nhấn ở eo
- Túi xách nhỏ, gọn gàng sẽ complement rất tốt

*Lưu ý: Đây là gợi ý demo. Kết nối AI đầy đủ sẽ cho phân tích chi tiết hơn.*`;
}

// Style advisor prompt template
export function buildStylePrompt(preferences: {
    occasion: string;
    style: string;
    budget: string;
    colors: string;
    gender: string;
    additionalInfo?: string;
}): string {
    return `Bạn là AI Stylist chuyên nghiệp của PH Store - một thương hiệu thời trang cao cấp Việt Nam.

Khách hàng có yêu cầu:
- Dịp mặc: ${preferences.occasion}
- Phong cách yêu thích: ${preferences.style}
- Ngân sách: ${preferences.budget}
- Màu sắc ưa thích: ${preferences.colors}
- Giới tính: ${preferences.gender}
${preferences.additionalInfo ? `- Thông tin thêm: ${preferences.additionalInfo}` : ''}

Hãy tư vấn phong cách thời trang cho khách hàng này bằng tiếng Việt, bao gồm:
1. **Tổng quan phong cách** phù hợp với yêu cầu (2-3 câu)
2. **Gợi ý outfit cụ thể** (3 outfit hoàn chỉnh với mô tả chi tiết)
3. **Lời khuyên về màu sắc** và cách phối màu
4. **Tips mặc đồ** thực tế phù hợp với khí hậu Việt Nam
5. **Từ khóa tìm kiếm** (5 từ khóa ngắn gọn để tìm sản phẩm phù hợp tại store)

Trả lời ngắn gọn, súc tích, sử dụng emoji để làm nổi bật. Kết thúc bằng encouragement thân thiện.`;
}

// Try-on prompt template  
export function buildTryOnPrompt(productName: string, productDescription: string): string {
    return `Bạn là AI Stylist chuyên nghiệp. Nhìn vào ảnh người dùng được cung cấp, hãy phân tích và tư vấn về sản phẩm thời trang sau:

Sản phẩm: **${productName}**
${productDescription ? `Mô tả: ${productDescription}` : ''}

Phân tích bằng tiếng Việt, bao gồm:
1. **Đánh giá phù hợp** (sản phẩm này có phù hợp với vóc dáng, tông màu da trong ảnh không?)
2. **Cách mặc gợi ý** (nên mặc như thế nào, size nào phù hợp)
3. **Phối đồ hoàn chỉnh** (nên phối cùng gì để tạo look đẹp nhất)
4. **Đánh giá tổng thể** (thang điểm /10 kèm nhận xét)

Trả lời thân thiện, tích cực, khuyến khích. Sử dụng emoji.`;
}
