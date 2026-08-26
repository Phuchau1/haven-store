'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Zap, Tag, Activity, ArrowLeft, Search, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface FlashSaleVariant {
    color: string;
    size: string;
    flashSalePrice: number;
    stockQuantity: number;
    soldQuantity: number;
}

interface FlashSaleProduct {
    productId: string | { id: string }; // To handle populate on client side if needed
    flashSalePrice: number;
    stockQuantity: number;
    soldQuantity: number;
    variants?: FlashSaleVariant[];
    useVariants?: boolean;
}

interface FlashSale {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    products: FlashSaleProduct[];
}

interface ProductBase {
    id: string;
    name: string;
    price?: number;
    variants?: Array<{ color: string; size: string }>;
    images?: string[];
}

export default function AdminFlashSalesPage() {
    const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FlashSale | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Product Selection State
    const [allProducts, setAllProducts] = useState<ProductBase[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [formData, setFormData] = useState({
        name: '', startTime: '', endTime: '', isActive: true, products: [] as FlashSaleProduct[]
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const [fsRes, prodRes] = await Promise.all([
                fetch('/api/flash-sales/admin'),
                fetch('/api/products?limit=1000') // fetch all products for selection
            ]);
            const fsData = await fsRes.json();
            const prodData = await prodRes.json();
            
            if (fsData.success) setFlashSales(fsData.data);
            if (prodData.success) setAllProducts(prodData.products);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const openModal = (item?: FlashSale) => {
        setErrorMsg('');
        setSearchKeyword('');
        if (item) {
            setEditingItem(item);
            
            // Normalize products (handle if productId is object due to populate)
            const normalizedProducts = (item.products || []).map(p => {
                const pid = typeof p.productId === 'object' ? (p.productId as { id: string }).id : p.productId;
                let variants = p.variants || [];
                
                // If old product without variants array, populate from allProducts
                if (variants.length === 0) {
                    const productInfo = allProducts.find(ap => ap.id === pid);
                    if (productInfo && productInfo.variants) {
                        variants = productInfo.variants.map((v) => ({
                            color: v.color,
                            size: v.size,
                            flashSalePrice: p.flashSalePrice || 0,
                            stockQuantity: p.stockQuantity || 0,
                            soldQuantity: 0
                        }));
                    }
                }

                return {
                    productId: pid,
                    flashSalePrice: p.flashSalePrice,
                    stockQuantity: p.stockQuantity,
                    soldQuantity: p.soldQuantity || 0,
                    variants: variants,
                    useVariants: p.variants && p.variants.length > 0
                };
            });

            setFormData({ 
                name: item.name, 
                startTime: new Date(item.startTime).toISOString().slice(0, 16), 
                endTime: new Date(item.endTime).toISOString().slice(0, 16), 
                isActive: item.isActive,
                products: normalizedProducts
            });
        } else {
            setEditingItem(null);
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            setFormData({ 
                name: '', 
                startTime: now.toISOString().slice(0, 16), 
                endTime: tomorrow.toISOString().slice(0, 16), 
                isActive: true, 
                products: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        
        if (formData.products.length === 0) {
            setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm cho Flash Sale.');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                startTime: formData.startTime,
                endTime: formData.endTime,
                isActive: formData.isActive,
                products: formData.products.map(p => ({
                    productId: p.productId,
                    flashSalePrice: p.flashSalePrice,
                    stockQuantity: p.stockQuantity,
                    soldQuantity: p.soldQuantity,
                    variants: p.useVariants ? p.variants : []
                }))
            };

            const url = editingItem ? `/api/flash-sales/admin/${editingItem._id}` : '/api/flash-sales/admin';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                fetchItems();
                setIsModalOpen(false);
            } else {
                setErrorMsg(data.message || 'Có lỗi xảy ra');
            }
        } catch {
            setErrorMsg('Không thể kết nối đến máy chủ');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chiến dịch này?')) return;
        try {
            const res = await fetch(`/api/flash-sales/admin/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) setFlashSales(flashSales.filter(c => c._id !== id));
            else alert(data.message);
        } catch (error) {
            console.error('Lỗi khi xóa:', error);
        }
    };

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleString('vi-VN'); } catch { return d; }
    };

    // Product Selection Handlers
    const handleAddProduct = (product: ProductBase) => {
        if (formData.products.find(p => p.productId === product.id)) return;
        
        // Setup initial variants
        const defaultPrice = product.price ? Math.round(product.price * 0.8) : 0;
        const variants = (product.variants || []).map((v) => ({
            color: v.color,
            size: v.size,
            flashSalePrice: defaultPrice,
            stockQuantity: 10,
            soldQuantity: 0
        }));

        setFormData({
            ...formData,
            products: [...formData.products, {
                productId: product.id,
                flashSalePrice: defaultPrice,
                stockQuantity: 100,
                soldQuantity: 0,
                variants: variants,
                useVariants: false
            }]
        });
    };

    const handleRemoveProduct = (productId: string) => {
        setFormData({
            ...formData,
            products: formData.products.filter(p => p.productId !== productId)
        });
    };

    const handleUpdateProduct = (productId: string, field: string, value: string | number | boolean) => {
        setFormData({
            ...formData,
            products: formData.products.map(p => 
                p.productId === productId ? { ...p, [field]: value } : p
            )
        });
    };

    const handleUpdateVariant = (productId: string, variantIndex: number, field: string, value: string | number | boolean) => {
        setFormData({
            ...formData,
            products: formData.products.map(p => {
                if (p.productId !== productId) return p;
                const newVariants = [...(p.variants || [])];
                newVariants[variantIndex] = { ...newVariants[variantIndex], [field]: value };
                return { ...p, variants: newVariants };
            })
        });
    };

    const filteredProducts = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        p.id.toLowerCase().includes(searchKeyword.toLowerCase())
    );

    if (isModalOpen) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
                    <div className="flex items-center gap-3.5">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="p-2.5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-2xs transition-all flex items-center gap-2 text-xs font-bold shrink-0 cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Quay lại danh sách
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                                {editingItem ? `Sửa Chiến Dịch: ${editingItem.name}` : 'Tạo Chiến Dịch Flash Sale Mới'}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Cấu hình thông tin thời gian, sản phẩm và giá ưu đãi chi tiết từng biến thể
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch'}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-2xl text-sm font-bold bg-rose-50 border border-rose-200 text-rose-700">
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ─── 1. THÔNG TIN CHIẾN DỊCH ─── */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            1. Thông Tin Chiến Dịch Flash Sale
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Tên chiến dịch</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="VD: Siêu sale 11.11 - Giảm sốc đến 50%" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Bắt đầu</label>
                                <input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Kết thúc</label>
                                <input type="datetime-local" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>

                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl border border-gray-200 bg-gray-50/50 w-full">
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-xs font-black text-gray-800">Kích hoạt chiến dịch ngay</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ─── 2. SẢN PHẨM & CẤU HÌNH BIẾN THỂ ─── */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                                <Tag size={16} className="text-indigo-600" />
                                2. Sản Phẩm & Cấu Hình Biến Thể ({formData.products.length} sản phẩm)
                            </h3>
                        </div>

                        {formData.products.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-xs font-medium text-gray-500">Chưa có sản phẩm nào được chọn. Vui lòng chọn sản phẩm bên dưới!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {formData.products.map((p, idx) => {
                                    const pIdStr = typeof p.productId === 'object' ? p.productId.id : p.productId;
                                    const productInfo = allProducts.find(ap => ap.id === pIdStr);
                                    const hasVariants = productInfo?.variants && productInfo.variants.length > 0;

                                    return (
                                        <div key={idx} className="bg-gray-50/60 p-5 rounded-2xl border border-gray-200 space-y-4">
                                            {/* Product Card Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                                        {productInfo?.images?.[0] ? (
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img src={productInfo.images[0]} alt={productInfo.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Tag className="w-6 h-6 text-gray-300 m-4" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{productInfo?.name || pIdStr}</h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">Mã: <span className="font-mono font-bold text-gray-700">{pIdStr}</span> | Giá gốc: <strong className="text-gray-900">{productInfo?.price?.toLocaleString() || 0}đ</strong></p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0">
                                                    {hasVariants && (
                                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 text-xs font-bold">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.useVariants || false}
                                                                onChange={(e) => handleUpdateProduct(pIdStr, 'useVariants', e.target.checked)}
                                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span>Cấu hình theo biến thể ({productInfo.variants?.length} biến thể)</span>
                                                        </label>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveProduct(pIdStr)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-200"
                                                        title="Bỏ sản phẩm này"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* General Pricing (When NOT using variants) */}
                                            {!p.useVariants && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200">
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Giá Flash Sale (VNĐ)</label>
                                                        <input
                                                            type="number"
                                                            value={p.flashSalePrice}
                                                            onChange={(e) => handleUpdateProduct(pIdStr, 'flashSalePrice', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Tồn kho Flash Sale</label>
                                                        <input
                                                            type="number"
                                                            value={p.stockQuantity}
                                                            onChange={(e) => handleUpdateProduct(pIdStr, 'stockQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Full-width Variant Pricing Grid */}
                                            {p.useVariants && p.variants && p.variants.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-black uppercase text-indigo-700 tracking-wider">Ma Trận Giá & Tồn Kho Chi Tiết Theo Biến Thể</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {p.variants.map((v, vIdx) => {
                                                            const discountPct = productInfo?.price && v.flashSalePrice ? Math.round(((productInfo.price - v.flashSalePrice) / productInfo.price) * 100) : 0;
                                                            return (
                                                                <div key={vIdx} className="bg-white p-4 border border-gray-200 rounded-2xl shadow-2xs hover:border-indigo-400 transition-all space-y-3">
                                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                                        <span className="text-xs font-black text-gray-900">
                                                                            {v.color} <span className="text-gray-400 font-normal">|</span> {v.size}
                                                                        </span>
                                                                        {discountPct > 0 && (
                                                                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                                                                -{discountPct}%
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                                                                                Giá Flash Sale (VNĐ)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Nhập giá FS"
                                                                                value={v.flashSalePrice !== undefined ? v.flashSalePrice : ''}
                                                                                onChange={(e) => handleUpdateVariant(pIdStr, vIdx, 'flashSalePrice', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                                                                                Tồn Kho Flash Sale
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Số lượng"
                                                                                value={v.stockQuantity !== undefined ? v.stockQuantity : ''}
                                                                                onChange={(e) => handleUpdateVariant(pIdStr, vIdx, 'stockQuantity', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ─── 3. TÌM & THÊM SẢN PHẨM MỚI ─── */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                            <Plus size={16} className="text-emerald-600" />
                            3. Thêm Sản Phẩm Mới Vào Chiến Dịch
                        </h3>

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                            {filteredProducts.slice(0, 30).map(product => {
                                const isSelected = formData.products.some(p => p.productId === product.id);
                                return (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50/70 border border-gray-200 rounded-2xl hover:border-indigo-300 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                                {product.images?.[0] ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Tag className="w-5 h-5 text-gray-300 m-3.5" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-gray-900 truncate">{product.name}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">Giá gốc: <strong>{product.price?.toLocaleString()}đ</strong></p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isSelected}
                                            onClick={() => handleAddProduct(product)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                                            }`}
                                        >
                                            {isSelected ? 'Đã thêm' : '+ Thêm'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Chiến Dịch Flash Sale'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--adm-text)' }}>
                        Quản lý Flash Sale
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--adm-text-muted)' }}>
                        {flashSales.length} chiến dịch
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/flash-sales/dashboard" className="adm-btn-secondary">
                        <Activity size={18} /> Xem Dashboard
                    </Link>
                    <button
                        onClick={() => openModal()}
                        className="adm-btn-primary flex items-center gap-2"
                        style={{ minHeight: 44 }}
                    >
                        <Plus size={18} /> Tạo mới
                    </button>
                </div>
            </div>

            <div className="adm-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Đang tải...</div>
                ) : flashSales.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Zap size={48} className="mb-4 text-gray-300" />
                        <p>Chưa có chiến dịch Flash Sale nào.</p>
                        <button onClick={() => openModal()} className="mt-4 text-indigo-600 font-semibold hover:underline">Tạo chiến dịch đầu tiên</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Tên chiến dịch</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th>Sản phẩm</th>
                                    <th className="text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flashSales.map((item) => {
                                    const now = new Date();
                                    const start = new Date(item.startTime);
                                    const end = new Date(item.endTime);
                                    let statusText = 'Đang chạy';
                                    let statusColor = 'bg-emerald-100 text-emerald-600';
                                    
                                    if (!item.isActive) {
                                        statusText = 'Đã tắt';
                                        statusColor = 'bg-gray-100 text-gray-600';
                                    } else if (now < start) {
                                        statusText = 'Sắp diễn ra';
                                        statusColor = 'bg-blue-100 text-blue-600';
                                    } else if (now > end) {
                                        statusText = 'Đã kết thúc';
                                        statusColor = 'bg-rose-100 text-rose-600';
                                    }

                                    return (
                                        <tr key={item._id}>
                                            <td className="font-bold" style={{ color: 'var(--adm-text)' }}>{item.name}</td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>
                                                <div className="text-xs">{formatDate(item.startTime)}</div>
                                                <div className="text-xs">{formatDate(item.endTime)}</div>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-1 text-xs font-bold rounded-md ${statusColor}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--adm-text-muted)' }}>{item.products?.length || 0} SP</td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openModal(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(item._id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
