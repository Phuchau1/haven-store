'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Save, Zap, Calendar, Tag, Activity } from 'lucide-react';
import Link from 'next/link';

interface FlashSaleVariant {
    color: string;
    size: string;
    flashSalePrice: number;
    stockQuantity: number;
    soldQuantity: number;
}

interface FlashSaleProduct {
    productId: string | any; // To handle populate on client side if needed
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

export default function AdminFlashSalesPage() {
    const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FlashSale | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);
    
    // Product Selection State
    const [allProducts, setAllProducts] = useState<any[]>([]);
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
                const pid = typeof p.productId === 'object' ? (p.productId as any).id : p.productId;
                let variants = p.variants || [];
                
                // If old product without variants array, populate from allProducts
                if (variants.length === 0) {
                    const productInfo = allProducts.find(ap => ap.id === pid);
                    if (productInfo && productInfo.variants) {
                        variants = productInfo.variants.map((v: any) => ({
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
        } catch (error) {
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
    const handleAddProduct = (product: any) => {
        if (formData.products.find(p => p.productId === product.id)) return;
        
        // Setup initial variants
        const defaultPrice = product.price ? Math.round(product.price * 0.8) : 0;
        const variants = (product.variants || []).map((v: any) => ({
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

    const handleUpdateProduct = (productId: string, field: string, value: any) => {
        setFormData({
            ...formData,
            products: formData.products.map(p => 
                p.productId === productId ? { ...p, [field]: value } : p
            )
        });
    };

    const handleUpdateVariant = (productId: string, variantIndex: number, field: string, value: any) => {
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

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" style={{ background: 'var(--adm-surface)', maxHeight: '95dvh', display: 'flex', flexDirection: 'column' }}>
                            <div className="flex items-center justify-between p-5 border-b shrink-0">
                                <h3 className="text-lg font-bold">{editingItem ? 'Sửa Flash Sale' : 'Tạo Flash Sale'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
                                {errorMsg && <div className="p-3 rounded-xl text-sm font-medium bg-red-100 text-red-600">{errorMsg}</div>}

                                <div>
                                    <label className="block text-xs font-bold uppercase mb-2">Tên chiến dịch</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="adm-input w-full" placeholder="VD: Siêu sale 11.11" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-2">Bắt đầu</label>
                                        <input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="adm-input w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-2">Kết thúc</label>
                                        <input type="datetime-local" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="adm-input w-full" />
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm font-bold">Kích hoạt chiến dịch</span>
                                    </label>
                                </div>

                                {/* Product Selector UI */}
                                <div className="mt-6 border-t pt-6">
                                    <h4 className="font-bold text-md mb-4 uppercase tracking-wider text-gray-800">Sản phẩm tham gia Flash Sale</h4>
                                    
                                    {/* Selected Products */}
                                    {formData.products.length > 0 && (
                                        <div className="mb-6 space-y-3">
                                            <p className="text-sm font-semibold text-indigo-600">Đã chọn ({formData.products.length} sản phẩm)</p>
                                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
                                                        <tr>
                                                            <th className="px-4 py-2">Sản phẩm</th>
                                                            <th className="px-4 py-2 w-32">Giá Flash Sale</th>
                                                            <th className="px-4 py-2 w-32">Tồn kho</th>
                                                            <th className="px-4 py-2 w-16 text-center">Biến thể</th>
                                                            <th className="px-4 py-2 w-16"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {formData.products.map((p, idx) => {
                                                            const productInfo = allProducts.find(ap => ap.id === p.productId);
                                                            return (
                                                                <React.Fragment key={idx}>
                                                                    <tr className="bg-white hover:bg-gray-50">
                                                                        <td className="px-4 py-2">
                                                                            <p className="font-semibold text-gray-800 line-clamp-1">{productInfo?.name || p.productId}</p>
                                                                            <p className="text-xs text-gray-500">Giá gốc: {productInfo?.price?.toLocaleString() || 0} đ</p>
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <input 
                                                                                type="number" 
                                                                                disabled={p.useVariants}
                                                                                value={p.flashSalePrice} 
                                                                                onChange={(e) => handleUpdateProduct(p.productId, 'flashSalePrice', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                className="adm-input w-full text-sm px-2 py-1 h-8 disabled:opacity-50"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <input 
                                                                                type="number" 
                                                                                disabled={p.useVariants}
                                                                                value={p.stockQuantity} 
                                                                                onChange={(e) => handleUpdateProduct(p.productId, 'stockQuantity', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                className="adm-input w-full text-sm px-2 py-1 h-8 disabled:opacity-50"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            {productInfo?.variants && productInfo.variants.length > 0 && (
                                                                                <label className="inline-flex items-center cursor-pointer">
                                                                                    <input 
                                                                                        type="checkbox" 
                                                                                        checked={p.useVariants || false}
                                                                                        onChange={(e) => handleUpdateProduct(p.productId, 'useVariants', e.target.checked)}
                                                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                                    />
                                                                                </label>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right">
                                                                            <button type="button" onClick={() => handleRemoveProduct(p.productId)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg">
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                    {p.useVariants && p.variants && p.variants.length > 0 && (
                                                                        <tr className="bg-gray-50">
                                                                            <td colSpan={5} className="p-4 border-t border-gray-200">
                                                                                <div className="pl-4 border-l-2 border-indigo-300 space-y-2">
                                                                                    <p className="text-xs font-bold uppercase text-indigo-600">Cấu hình giá theo biến thể</p>
                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                                                                        {p.variants.map((v, vIdx) => (
                                                                                            <div key={vIdx} className="flex flex-col gap-2 bg-white p-3 border border-gray-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                                                                                                <div className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2">
                                                                                                    {v.color} <span className="text-gray-400 font-normal mx-1">|</span> {v.size}
                                                                                                </div>
                                                                                                <div className="flex flex-col gap-2 pt-1">
                                                                                                    <div className="flex items-center justify-between">
                                                                                                        <label className="text-[10px] text-gray-500 font-medium">Giá Flash Sale</label>
                                                                                                        <input 
                                                                                                            type="number" 
                                                                                                            placeholder="Giá FS"
                                                                                                            value={v.flashSalePrice !== undefined ? v.flashSalePrice : ''}
                                                                                                            onChange={(e) => handleUpdateVariant(p.productId, vIdx, 'flashSalePrice', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                                            className="w-24 px-2 py-1.5 rounded-md border text-right text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all bg-gray-50"
                                                                                                        />
                                                                                                    </div>
                                                                                                    <div className="flex items-center justify-between">
                                                                                                        <label className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Tồn kho FS</label>
                                                                                                        <input 
                                                                                                            type="number" 
                                                                                                            placeholder="Tồn kho"
                                                                                                            value={v.stockQuantity !== undefined ? v.stockQuantity : ''}
                                                                                                            onChange={(e) => handleUpdateVariant(p.productId, vIdx, 'stockQuantity', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                                                                                            className="w-20 px-2 py-1.5 rounded-md border text-right text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-all bg-gray-50"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Product Search */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Thêm sản phẩm mới</p>
                                        <input 
                                            type="text" 
                                            placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..." 
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            className="adm-input w-full mb-3"
                                        />
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                            {filteredProducts.slice(0, 20).map(product => {
                                                const isSelected = formData.products.some(p => p.productId === product.id);
                                                return (
                                                    <div key={product.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                                {product.images && product.images[0] ? (
                                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Tag className="w-5 h-5 text-gray-400 m-2.5" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-800 line-clamp-1">{product.name}</p>
                                                                <p className="text-xs text-gray-500">{product.id} - Giá gốc: {product.price?.toLocaleString()} đ</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            disabled={isSelected}
                                                            onClick={() => handleAddProduct(product)}
                                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${isSelected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
                                                        >
                                                            {isSelected ? 'Đã thêm' : 'Thêm'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            {filteredProducts.length > 20 && (
                                                <p className="text-xs text-center text-gray-500 py-2">Hiển thị 20/{filteredProducts.length} kết quả. Vui lòng tìm kiếm chi tiết hơn.</p>
                                            )}
                                            {filteredProducts.length === 0 && (
                                                <p className="text-sm text-center text-gray-500 py-4">Không tìm thấy sản phẩm nào.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="adm-btn-secondary flex-1">Hủy</button>
                                    <button type="submit" disabled={saving} className="adm-btn-primary flex-1 flex items-center justify-center gap-2"><Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
