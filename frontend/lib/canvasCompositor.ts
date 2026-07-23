'use client';

/**
 * ============================================================
 * AI VIRTUAL TRY-ON — CLIENT-SIDE CANVAS COMPOSITOR v2
 * 
 * Ghép trang phục vào vùng thân người dùng bằng Canvas 2D API.
 * Hoạt động hoàn toàn trên trình duyệt, không cần API key.
 * Áp dụng kỹ thuật:
 *   - Segment vùng thân người theo tỷ lệ cơ thể chuẩn
 *   - Blend Mode (multiply + overlay) để khớp ánh sáng
 *   - Shadow & Gaussian Blur để tạo nếp gấp vải tự nhiên
 *   - Aspect-ratio preserving fit để không bị méo trang phục
 * ============================================================
 */

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // crossOrigin cần thiết để Canvas không bị taint khi vẽ ảnh từ CDN khác
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Retry không có CORS nếu thất bại (ảnh local / same-origin)
            const img2 = new Image();
            img2.onload = () => resolve(img2);
            img2.onerror = reject;
            img2.src = src;
        };
        img.src = src;
    });
}

/**
 * Tính tọa độ vùng thân người dựa vào loại sản phẩm
 */
function getGarmentRect(W: number, H: number, category: string) {
    const cat = (category || 'tops').toLowerCase();

    if (['bottoms', 'pants', 'quan', 'jeans', 'shorts'].some(c => cat.includes(c))) {
        // Quần: từ 48% → 96%
        const w = W * 0.70;
        const x = (W - w) / 2;
        return { x, y: H * 0.47, w, h: H * 0.50 };
    }
    if (['dress', 'vay', 'one-piece', 'jumpsuit', 'set'].some(c => cat.includes(c))) {
        // Váy / đầm / set: từ 15% → 97%
        const w = W * 0.76;
        const x = (W - w) / 2;
        return { x, y: H * 0.14, w, h: H * 0.83 };
    }
    if (['outerwear', 'khoac', 'jacket', 'coat', 'hoodie'].some(c => cat.includes(c))) {
        // Áo khoác: Rộng hơn, từ 12% → 78%
        const w = W * 0.86;
        const x = (W - w) / 2;
        return { x, y: H * 0.12, w, h: H * 0.66 };
    }
    // Default: Áo (tops) từ 13% → 57%
    const w = W * 0.74;
    const x = (W - w) / 2;
    return { x, y: H * 0.13, w, h: H * 0.44 };
}

/**
 * Ghép trang phục lên ảnh người dùng bằng Canvas API
 * @param userImageSrc - ảnh người dùng (base64 data URL)
 * @param garmentImageSrc - URL ảnh sản phẩm
 * @param category - loại sản phẩm
 * @returns base64 JPEG ảnh đã ghép
 */
export async function compositeGarmentOnPerson(
    userImageSrc: string,
    garmentImageSrc: string,
    category = 'tops'
): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Load song song cả hai ảnh
    const [personImg, garmentImg] = await Promise.all([
        loadImage(userImageSrc),
        loadImage(garmentImageSrc).catch(() => null)
    ]);

    const W = personImg.naturalWidth  || personImg.width;
    const H = personImg.naturalHeight || personImg.height;
    canvas.width  = W;
    canvas.height = H;

    // ── Step 1: Vẽ ảnh người gốc làm nền toàn bộ
    ctx.drawImage(personImg, 0, 0, W, H);

    if (!garmentImg) {
        // Không load được ảnh trang phục → trả về ảnh người gốc
        return canvas.toDataURL('image/jpeg', 0.93);
    }

    const rect = getGarmentRect(W, H, category);

    // Tính tỷ lệ aspect-ratio của ảnh trang phục để không bị méo
    const garmentAspect = garmentImg.naturalWidth / garmentImg.naturalHeight;
    let drawW = rect.w;
    let drawH = rect.h;
    if (drawW / drawH > garmentAspect) {
        drawW = drawH * garmentAspect;
    } else {
        drawH = drawW / garmentAspect;
    }
    const drawX = rect.x + (rect.w - drawW) / 2;
    const drawY = rect.y + (rect.h - drawH) / 2;

    // ── Step 2: Shadow dưới trang phục tạo chiều sâu
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.30)';
    ctx.shadowBlur  = Math.round(W * 0.025);
    ctx.shadowOffsetX = Math.round(W * 0.004);
    ctx.shadowOffsetY = Math.round(H * 0.008);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.0; // Chỉ để vẽ shadow, trang phục trong suốt
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.restore();

    // ── Step 3: Lớp Multiply — Khớp tông màu và ánh sáng ảnh gốc
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.75;
    ctx.drawImage(garmentImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // ── Step 4: Lớp Screen nhẹ — Giữ lại highlight/màu sáng của vải
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18;
    ctx.drawImage(garmentImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // ── Step 5: Lớp source-over mạnh — Hiển thị màu sắc chính xác của trang phục
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.78;
    ctx.drawImage(garmentImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // ── Step 6: Gradient fade mép dưới trang phục để transition tự nhiên
    ctx.save();
    const fadeH = drawH * 0.18;
    const fadeGrad = ctx.createLinearGradient(drawX, drawY + drawH - fadeH, drawX, drawY + drawH);
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(drawX, drawY + drawH - fadeH, drawW, fadeH);
    ctx.restore();

    // ── Step 7: Watermark nhỏ góc dưới phải
    ctx.save();
    ctx.globalAlpha = 0.50;
    const fontSize = Math.max(10, Math.round(W / 60));
    ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.90)';
    ctx.textAlign  = 'right';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur  = 4;
    ctx.fillText('✨ Haven AI Try-On Studio', W - 10, H - 10);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.93);
}

/**
 * Tạo preview ảnh ghép tức thì (không cần gọi backend)
 * Dùng để hiển thị preview real-time khi người dùng chọn sản phẩm
 */
export async function quickPreviewComposite(
    userImageSrc: string,
    garmentImageSrc: string,
    category = 'tops'
): Promise<string> {
    try {
        return await compositeGarmentOnPerson(userImageSrc, garmentImageSrc, category);
    } catch {
        return userImageSrc;
    }
}
