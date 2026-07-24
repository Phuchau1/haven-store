'use client';

/**
 * ============================================================
 * SMART PHOTOREALISTIC TRY-ON ENGINE v6
 *
 * Sửa lỗi v5: Tự phát hiện ảnh cận cảnh vs toàn thân
 * để đặt trang phục đúng vị trí, không che mặt.
 * ============================================================
 */

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Thử lại không có crossOrigin
            const img2 = new Image();
            img2.onload = () => resolve(img2);
            img2.onerror = reject;
            img2.src = src;
        };
        img.src = src;
    });
}

/**
 * Phát hiện loại ảnh dựa trên tỷ lệ khuôn hình:
 * - Portrait (đứng, toàn thân): H > W * 1.2
 * - Square/Landscape (cận cảnh selfie): H ≤ W * 1.2
 *
 * Trả về: 'fullbody' | 'halfbody' | 'closeup'
 */
function detectPhotoType(W: number, H: number): 'fullbody' | 'halfbody' | 'closeup' {
    const ratio = H / W;
    if (ratio >= 1.6) return 'fullbody';    // Ảnh dọc toàn thân (H >> W)
    if (ratio >= 1.1) return 'halfbody';    // Ảnh dọc nửa người
    return 'closeup';                        // Ảnh vuông / ngang = selfie cận cảnh
}

/**
 * Bóc nền trắng/be/xám của sản phẩm và cắt móc treo
 */
function cleanGarmentBackground(img: HTMLImageElement): HTMLCanvasElement {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const cutY = Math.round(h * 0.18); // Cắt 18% phần trên (móc treo)

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (y < cutY) { data[idx + 3] = 0; continue; }

            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            // Xóa nền sáng các loại (trắng, be, xám nhạt, cream)
            const bright = (r + g + b) / 3;
            const isBrightBg = bright > 200 && Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 30;
            const isBeigeBg = r > 195 && g > 185 && b > 165 && r > b + 15;

            if (isBrightBg || isBeigeBg) {
                data[idx + 3] = 0;
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

/**
 * Tính toán vị trí đặt trang phục dựa trên loại ảnh
 */
function calcGarmentPosition(
    W: number, H: number,
    category: string,
    photoType: 'fullbody' | 'halfbody' | 'closeup'
): { destX: number; destY: number; destW: number; destH: number } {
    const cat = category.toLowerCase();

    // ── Xác định tỷ lệ theo category
    let widthRatio: number, heightRatio: number, yRatio: number;

    if (['lower_body', 'quan', 'pants', 'jeans', 'shorts', 'skirt'].some(k => cat.includes(k))) {
        // Quần / Váy
        switch (photoType) {
            case 'fullbody':
                widthRatio = 0.50; heightRatio = 0.42; yRatio = 0.52; break;
            case 'halfbody':
                widthRatio = 0.55; heightRatio = 0.40; yRatio = 0.55; break;
            default: // closeup: quần sẽ không thấy — đặt ở dưới cùng
                widthRatio = 0.65; heightRatio = 0.35; yRatio = 0.62; break;
        }
    } else if (['dresses', 'vay', 'dam', 'one-piece'].some(k => cat.includes(k))) {
        // Đầm / Váy liền
        switch (photoType) {
            case 'fullbody':
                widthRatio = 0.60; heightRatio = 0.62; yRatio = 0.30; break;
            case 'halfbody':
                widthRatio = 0.64; heightRatio = 0.55; yRatio = 0.34; break;
            default:
                widthRatio = 0.70; heightRatio = 0.50; yRatio = 0.45; break;
        }
    } else {
        // Áo (Tops / Polo / T-Shirt / Hoodie)
        switch (photoType) {
            case 'fullbody':
                // Toàn thân: Vai ở khoảng 30-35% chiều cao
                widthRatio = 0.55; heightRatio = 0.38; yRatio = 0.30; break;
            case 'halfbody':
                // Nửa người: Vai ở khoảng 42-48% chiều cao
                widthRatio = 0.58; heightRatio = 0.40; yRatio = 0.42; break;
            default:
                // Selfie cận cảnh: Phần ngực/vai chiếm phần dưới 40% ảnh
                widthRatio = 0.75; heightRatio = 0.42; yRatio = 0.56; break;
        }
    }

    const destW = W * widthRatio;
    const destH = H * heightRatio;
    const destX = (W - destW) / 2;
    const destY = H * yRatio;

    return { destX, destY, destW, destH };
}

/**
 * Main: Phủ trang phục lên ảnh người dùng
 */
export async function renderSmartTryOn(
    userImageSrc: string,
    garmentImageSrc: string,
    category = 'upper_body'
): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const [personImg, rawGarmentImg] = await Promise.all([
        loadImage(userImageSrc),
        loadImage(garmentImageSrc).catch(() => null)
    ]);

    const W = personImg.naturalWidth || personImg.width;
    const H = personImg.naturalHeight || personImg.height;
    canvas.width = W;
    canvas.height = H;

    // 1. Vẽ ảnh người gốc
    ctx.drawImage(personImg, 0, 0, W, H);

    if (!rawGarmentImg) return canvas.toDataURL('image/jpeg', 0.92);

    // 2. Phát hiện loại ảnh
    const photoType = detectPhotoType(W, H);

    // 3. Bóc tách nền sản phẩm
    const cleanedGarmentCanvas = cleanGarmentBackground(rawGarmentImg);

    // 4. Tính vị trí dựa trên loại ảnh
    const { destX, destY, destW, destH } = calcGarmentPosition(W, H, category, photoType);

    // 5. Phủ áo mới lên người
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = Math.round(W * 0.015);
    ctx.shadowOffsetY = Math.round(H * 0.006);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(cleanedGarmentCanvas, destX, destY, destW, destH);
    ctx.restore();

    // 6. Watermark nhỏ
    ctx.save();
    ctx.globalAlpha = 0.55;
    const fontSize = Math.max(10, Math.round(W / 60));
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText('✨ Haven AI Try-On', W - 10, H - 10);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.92);
}
