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
