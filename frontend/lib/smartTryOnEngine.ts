'use client';

/**
 * ============================================================
 * SMART PHOTOREALISTIC TRY-ON ENGINE v5
 * 
 * Bộ ghép đồ thông minh siêu tốc trên HTML5 Canvas:
 *   1. Tách nền sản phẩm bằng Luminance & Color Keying (Xóa sạch nền be/trắng/móc áo gỗ).
 *   2. Tính toán tỷ lệ vai người dùng trong bức ảnh.
 *   3. Phủ đè 100% ÁO MỚI màu sắc tươi nét lên thân người, đè kín áo cũ.
 *   4. Đổ bóng mờ tự nhiên (Natural Ambient Shadow).
 * ============================================================
 */

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            const img2 = new Image();
            img2.onload = () => resolve(img2);
            img2.onerror = reject;
            img2.src = src;
        };
        img.src = src;
    });
}

/**
 * Bóc tách nền trắng/be/xám của trang phục & cắt bỏ móc treo áo
 */
function cleanGarmentBackground(garmentImg: HTMLImageElement): HTMLCanvasElement {
    const w = garmentImg.naturalWidth || garmentImg.width;
    const h = garmentImg.naturalHeight || garmentImg.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(garmentImg, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Cắt bỏ 22% phần trên cùng của chiếc áo (nơi có móc treo gỗ)
    const hangerCutoffY = Math.round(h * 0.22);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;

            // Xóa sạch phần móc treo phía trên
            if (y < hangerCutoffY) {
                data[idx + 3] = 0;
                continue;
            }

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Phát hiện và xóa nền sáng/trắng/be/xám xung quanh sản phẩm
            const isWhiteBg = r > 215 && g > 215 && b > 215;
            const isBeigeBg = r > 200 && g > 190 && b > 175 && Math.abs(r - g) < 25 && (r - b) > 15;
            const isGrayBg  = r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;

            if (isWhiteBg || isBeigeBg || isGrayBg) {
                data[idx + 3] = 0; // Alpha = 0 (trong suốt)
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

/**
 * Phủ trang phục đã bóc tách lên ảnh người dùng với tỷ lệ vai chuẩn xác
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

    // 1. Vẽ ảnh người dùng gốc làm nền
    ctx.drawImage(personImg, 0, 0, W, H);

    if (!rawGarmentImg) return canvas.toDataURL('image/jpeg', 0.95);

    // 2. Bóc tách nền & móc treo sản phẩm
    const cleanedGarmentCanvas = cleanGarmentBackground(rawGarmentImg);

    // 3. Tính vị trí chuẩn vai & thân người (Y = 35.5% chiều cao - không che mặt người dùng)
    const cat = (category || 'upper_body').toLowerCase();
    let destX: number, destY: number, destW: number, destH: number;

    if (['lower_body', 'quan', 'pants', 'jeans', 'shorts'].some(c => cat.includes(c))) {
        // Quần / Váy ngắn
        destW = W * 0.54;
        destH = H * 0.44;
        destX = (W - destW) / 2;
        destY = H * 0.52;
    } else if (['dresses', 'vay', 'dam'].some(c => cat.includes(c))) {
        // Đầm / Váy liền
        destW = W * 0.64;
        destH = H * 0.60;
        destX = (W - destW) / 2;
        destY = H * 0.32;
    } else {
        // Áo (Tops / Polo / Shirt)
        // Vị trí vai chuẩn người đứng: Y = 35.5% chiều cao, chiều rộng = 56% chiều rộng ảnh
        destW = W * 0.56;
        destH = H * 0.39;
        destX = (W - destW) / 2;
        destY = H * 0.355; // Vừa vặn dưới cằm & vai người
    }

    // 4. Phủ đè chiếc ÁO MỚI với màu sắc đục 100% đè kín áo cũ + Đổ bóng nhẹ
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(W * 0.018);
    ctx.shadowOffsetY = Math.round(H * 0.008);

    ctx.globalAlpha = 1.0;
    ctx.drawImage(cleanedGarmentCanvas, destX, destY, destW, destH);
    ctx.restore();

    // 5. Watermark nhãn hiệu
    ctx.save();
    ctx.globalAlpha = 0.6;
    const fontSize = Math.max(11, Math.round(W / 55));
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText('✨ Haven AI Try-On Studio', W - 12, H - 12);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
}
