'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Trash2, Save, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';

interface VariantInfo {
    id: string;
    sku: string;
    product_name: string;
    color_id: string;
    size_id: string;
    stock: number;
    price?: number;
    image?: string;
}

interface ReceiptItem {
    variant_id: string;
    name: string;
    variant_label: string;
    currentStock: number;
    quantity: number;
    price: number;
}

interface Warehouse {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

export default function NewStockReceipt() {
    const router = useRouter();
    const { token, user } = useAuth();
    
    const [type, setType] = useState('IMPORT');
    const [warehouseId, setWarehouseId] = useState('');
    const [destWarehouseId, setDestWarehouseId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    
    const [items, setItems] = useState<ReceiptItem[]>([]);
    
    // Data sources
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [allVariants, setAllVariants] = useState<VariantInfo[]>([]);
    
    // Search products to add
    const [search, setSearch] = useState('');
    const [filteredVariants, setFilteredVariants] = useState<VariantInfo[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        // Fetch Warehouses
        fetch('/api/warehouses')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setWarehouses(data.data);
                    setWarehouseId(data.data[0].id);
                }
            });

        // Fetch Suppliers
        fetch('/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setSuppliers(data.data);
                    setSupplierId(data.data[0].id);
                }
            });

        // Fetch Stock Variants
        fetch('/api/inventory/stock')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAllVariants(data.data);
                }
            });
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredVariants([]);
            return;
        }
        const filtered = allVariants.filter(v => 
            v.sku.toLowerCase().includes(search.toLowerCase()) || 
            v.product_name.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 5); // Limit 5 results
        setFilteredVariants(filtered);
    }, [search, allVariants]);

    const addItem = (variant: VariantInfo) => {
        const existing = items.find(i => i.variant_id === variant.sku);
        if (existing) {
            setItems(items.map(i => i.variant_id === variant.sku ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, { 
                variant_id: variant.sku, 
                name: variant.product_name,
                variant_label: `${variant.color_id} - ${variant.size_id}`,
                currentStock: variant.stock,
                quantity: 1, 
                price: variant.price || 0 
            }]);
        }
        setSearch('');
    };

    const removeItem = (sku: string) => {
        setItems(items.filter(i => i.variant_id !== sku));
    };

    const updateItem = (sku: string, field: string, value: number) => {
        // Prevent negative values
        if (value < 0) value = 0;
        setItems(items.map(i => i.variant_id === sku ? { ...i, [field]: value } : i));
    };

    const handleSave = async () => {
        if (items.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm');
        if (!warehouseId) return alert('Vui lòng chọn kho thực hiện');
        if (type === 'TRANSFER' && !destWarehouseId) return alert('Vui lòng chọn kho đích');
        if (type === 'TRANSFER' && warehouseId === destWarehouseId) return alert('Kho nguồn và kho đích phải khác nhau');
        
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/stock-receipts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': token || user?.id || ''
                },
                body: JSON.stringify({
                    type,
                    warehouse_id: warehouseId,
                    dest_warehouse_id: type === 'TRANSFER' ? destWarehouseId : undefined,
                    supplier_id: type === 'IMPORT' ? supplierId : undefined,
                    reason,
                    note,
                    user_id: user?.id || 'admin',
                    items: items.map(i => ({ variant_id: i.variant_id, quantity: Number(i.quantity), price: Number(i.price) }))
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Tạo phiếu thành công!');
                router.push('/admin/inventory/receipts');
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (error) {
            alert('Lỗi kết nối!');
        } finally {
            setLoading(false);
        }
    };

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Tạo Phiếu Kho</h2>
                        <p className="text-xs text-slate-500">Nhập / Xuất / Chuyển / Điều chỉnh</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={loading || items.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                >
                    <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu Phiếu Kho'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin chung */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                            <AlertCircle size={18} className="text-indigo-500"/> Thông tin chung
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Loại Phiếu <span className="text-rose-500">*</span></label>
                                <select 
                                    value={type} 
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                >
                                    <option value="IMPORT">Nhập Kho (Cộng tồn)</option>
                                    <option value="EXPORT">Xuất Kho (Trừ tồn)</option>
                                    <option value="TRANSFER">Chuyển Kho</option>
                                    <option value="ADJUSTMENT">Điều chỉnh Kho</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Kho thực hiện <span className="text-rose-500">*</span></label>
                                <select 
                                    value={warehouseId} 
                                    onChange={(e) => setWarehouseId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.id})</option>)}
                                </select>
                            </div>

                            {type === 'TRANSFER' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Kho đích (Nhận) <span className="text-rose-500">*</span></label>
                                    <select 
                                        value={destWarehouseId} 
                                        onChange={(e) => setDestWarehouseId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">-- Chọn kho đích --</option>
                                        {warehouses.filter(w => w.id !== warehouseId).map(w => <option key={w.id} value={w.id}>{w.name} ({w.id})</option>)}
                                    </select>
                                </div>
                            )}

                            {type === 'IMPORT' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nhà cung cấp</label>
                                    <select 
                                        value={supplierId} 
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    >
                                        <option value="">-- Chọn NCC --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do</label>
                                <input 
                                    type="text" 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ví dụ: Nhập hàng đợt 1, Xuất bán buôn..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                                <textarea 
                                    value={note} 
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Ghi chú nội bộ..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chi tiết sản phẩm */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[500px] flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                            <span>Chi tiết sản phẩm <span className="text-rose-500">*</span></span>
                            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{items.length} sản phẩm</span>
                        </h3>
                        
                        <div className="relative mb-6">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-500 transition-all">
                                <Search className="text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Tìm SKU hoặc Tên sản phẩm để thêm vào phiếu..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-transparent border-none py-3 px-3 text-sm outline-none"
                                />
                            </div>
                            
                            {/* Autocomplete dropdown */}
                            {filteredVariants.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                                    {filteredVariants.map(v => (
                                        <button 
                                            key={v.id}
                                            onClick={() => addItem(v)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                    {v.image && v.image !== '/products/placeholder.jpg' ? (
                                                        <img src={v.image} className="w-full h-full object-cover" alt={v.product_name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-indigo-500 text-sm font-bold bg-indigo-50">
                                                            {v.product_name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-sm text-slate-800">{v.product_name}</p>
                                                    <p className="text-xs text-slate-500">SKU: {v.sku} | {v.color_id} - {v.size_id}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-600">Tồn: {v.stock}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bảng sản phẩm đã chọn */}
                        {items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <Plus className="text-slate-300" size={32} />
                                </div>
                                <p className="font-medium text-slate-500">Chưa có sản phẩm nào được chọn</p>
                                <p className="text-xs mt-1">Tìm kiếm và click để thêm sản phẩm vào phiếu</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="py-3 px-4 text-xs text-slate-500 font-bold uppercase">Sản phẩm</th>
                                            <th className="py-3 px-2 text-xs text-slate-500 font-bold uppercase text-center w-24">Tồn HT</th>
                                            <th className="py-3 px-2 text-xs text-slate-500 font-bold uppercase text-center w-28">Số lượng</th>
                                            <th className="py-3 px-2 text-xs text-slate-500 font-bold uppercase text-right w-32">Đơn giá</th>
                                            <th className="py-3 px-4 text-xs text-slate-500 font-bold uppercase text-right w-32">Thành tiền</th>
                                            <th className="py-3 px-2 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map(item => (
                                            <tr key={item.variant_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <p className="font-bold text-sm text-slate-800">{item.variant_id}</p>
                                                    <p className="text-xs text-slate-500 truncate max-w-[200px]" title={item.name}>{item.name}</p>
                                                    <p className="text-xs text-indigo-500 font-medium">{item.variant_label}</p>
                                                </td>
                                                <td className="py-3 px-2 text-center text-sm font-semibold text-slate-600">
                                                    {item.currentStock}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.variant_id, 'quantity', Number(e.target.value))}
                                                        className="w-full text-center py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(item.variant_id, 'price', Number(e.target.value))}
                                                        className="w-full text-right py-1.5 px-2 border border-slate-200 rounded-lg text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                </td>
                                                <td className="py-3 px-4 text-right text-sm font-bold text-slate-700">
                                                    {(item.quantity * item.price).toLocaleString('vi-VN')} đ
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button onClick={() => removeItem(item.variant_id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Tổng cộng */}
                        {items.length > 0 && (
                            <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số lượng</p>
                                        <p className="text-xl font-bold text-indigo-600">{totalQuantity.toLocaleString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Mã sản phẩm</p>
                                        <p className="text-xl font-bold text-slate-800">{items.length}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Tổng giá trị phiếu</p>
                                    <p className="text-2xl font-black text-rose-600">{totalAmount.toLocaleString('vi-VN')} đ</p>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
