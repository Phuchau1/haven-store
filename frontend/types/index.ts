// ===== TYPES CHO TOÀN BỘ ỨNG DỤNG =====

export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    categoryLabel: string;
    subCategory?: string;
    subCategoryLabel?: string;
    images: string[];
    sizes: string[];
    colors: Color[];
    description: string;
    content?: string; // Nội dung chi tiết
    
    // --- NEW FIELDS FOR DETAILED DESCRIPTION ---
    shortDescription?: string;
    richContent?: string;
    specifications?: Record<string, string>;
    sizeGuide?: any[];
    careInstructions?: string[];
    features?: string[];
    tags?: string[];
    seo?: { title?: string; description?: string; keywords?: string; slug?: string; };
    faqs?: { question: string; answer: string; }[];
    certificates?: string[];
    fabric?: string[];
    status?: 'draft' | 'published' | 'scheduled';
    publishAt?: string;
    videos?: string[];

    instructions?: string[]; // Hướng dẫn sử dụng
    notes?: string[]; // Lưu ý nhỏ
    sizeChartImage?: string; // Ảnh bảng size
    badge?: string;
    rating: number;
    reviews: number;
    inStock: boolean;
    soldQuantity?: number;
    createdAt?: string; // Thêm trường createdAt
    variants?: ProductVariantStock[];
}

export interface ProductVariantStock {
    color: string;
    size: string;
    stock: number;
    price?: number;
    originalPrice?: number;
}

export interface ProductReview {
    id: string;
    user_id: string;
    userName: string;
    userEmail?: string;
    product_id: string;
    productName?: string; // Tên sản phẩm được map từ Backend
    rating: number;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface Color {
    name: string;
    hex: string;
    image?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    phone?: string;
    address?: string;
    avatar?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    selectedSize: string;
    selectedColor: Color;
}

export interface OrderData {
    id?: string;
    customerName: string;
    phone: string;
    email: string;
    address: string;
    paymentMethod: string;
    items: CartItem[];
    totalAmount: number;
    couponCode?: string;
    discountAmount?: number;
    finalAmount: number;
    note?: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refund_requested' | 'refunded';
    shippingProvider?: string;
    createdAt: string;
}

export interface OrderResponse {
    success: boolean;
    orderId: string;
    message: string;
}

export interface FilterState {
    category: string;
    subCategory?: string;
    search?: string;
    sizes: string[];
    colors: string[];
    priceRange: [number, number];
    sortBy: 'newest' | 'price-asc' | 'price-desc' | 'popular';
    discount?: string;
}
