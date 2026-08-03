// ===== HELPER FORMAT TIỀN VND =====
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
}

// ===== HELPER CHUYỂN ĐỔI CHUỖI THÀNH SLUG CHUẨN URL (SEO) =====
export function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9 -]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// ===== HELPER LẤY SLUG SẢN PHẨM HIỂN THỊ TRÊN URL =====
export function getProductSlug(product: { id?: string; name?: string; slug?: string }): string {
    if (!product) return '';
    if (product.slug) return product.slug;
    if (product.name) {
        const slugName = slugify(product.name);
        if (slugName) return slugName;
    }
    return product.id || '';
}

// ===== HELPER CHUẨN HÓA TIÊU ĐỀ SẢN PHẨM TRÁNH DÍNH CHỮ/LỖI DẤU CÂU =====
export function cleanProductTitle(name: string): string {
    if (!name) return '';
    return name
        .replace(/\.([a-zA-ZÀ-ỹ])/g, '. $1')  // Thêm khoảng trắng sau dấu chấm nếu bị dính (vd: Nút.Fitted -> Nút. Fitted)
        .replace(/([a-zA-ZÀ-ỹ])\.([a-zA-ZÀ-ỹ])/g, '$1. $2')
        .replace(/\s+/g, ' ')
        .trim();
}
