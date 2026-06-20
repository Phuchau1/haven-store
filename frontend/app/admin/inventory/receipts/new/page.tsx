'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Trash2, Save, Search } from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';

export default function NewStockReceipt() {
    const router = useRouter();
    const { token, user } = useAuth();
    
    const [type, setType] = useState('IMPORT');
    const [warehouseId, setWarehouseId] = useState('WH-MAIN');
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    
    const [items, setItems] = useState<any[]>([]);
    
    // Search products to add
    const [search, setSearch] = useState('');
    const [allVariants, setAllVariants] = useState<any[]>([]);
    const [filteredVariants, setFilteredVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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

    const addItem = (variant: any) => {
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
        setItems(items.map(i => i.variant_id === sku ? { ...i, [field]: value } : i));
    };

    const handleSave = async () => {
        if (items.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm');
        
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock-receipts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': token || user?.id || ''
                },
                body: JSON.stringify({
                    type,
                    warehouse_id: warehouseId,
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Tạo Phiếu Kho</h2>
                        <p className="text-sm text-slate-500">Nhập / Xuất / Điều chỉnh kho</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={loading || items.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                    <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu Phiếu Kho'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin chung */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Thông tin chung</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Loại Phiếu</label>
                                <select 
                                    value={type} 
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                >
                                    <option value="IMPORT">Nhập Kho (Cộng tồn)</option>
                                    <option value="EXPORT">Xuất Kho (Trừ tồn)</option>
                                    <option value="ADJUSTMENT">Kiểm Kho (Điều chỉnh)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Kho thao tác</label>
                                <select 
                                    value={warehouseId} 
                                    onChange={(e) => setWarehouseId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                >
                                    <option value="WH-MAIN">Kho Tổng (Hà Nội)</option>
                                    <option value="WH-HCM">Kho Phụ (TP.HCM)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do</label>
                                <input 
                                    type="text" 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Nhập hàng mới, Xuất bán, Hư hỏng..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                                <textarea 
                                    value={note} 
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chi tiết sản phẩm */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[500px]">
                        <h3 className="font-bold text-slate-800 mb-4">Chi tiết sản phẩm</h3>
                        
                        <div className="relative mb-6">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
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
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
                                    {filteredVariants.map(v => (
                                        <button 
                                            key={v.id}
                                            onClick={() => addItem(v)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
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
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <Plus className="mb-2 text-slate-300" size={32} />
                                <p>Chưa có sản phẩm nào được chọn</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="py-3 px-2 text-xs text-slate-500 font-semibold uppercase">SKU / Sản phẩm</th>
                                            <th className="py-3 px-2 text-xs text-slate-500 font-semibold uppercase text-center">Tồn kho HT</th>
                                            <th className="py-3 px-2 text-xs text-slate-500 font-semibold uppercase text-center w-24">Số lượng</th>
                                            <th className="py-3 px-2 text-xs text-slate-500 font-semibold uppercase text-right w-32">Đơn giá</th>
                                            <th className="py-3 px-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map(item => (
                                            <tr key={item.variant_id}>
                                                <td className="py-3 px-2">
                                                    <p className="font-bold text-sm text-slate-800">{item.variant_id}</p>
                                                    <p className="text-xs text-slate-500">{item.name} ({item.variant_label})</p>
                                                </td>
                                                <td className="py-3 px-2 text-center text-sm font-semibold text-slate-600">
                                                    {item.currentStock}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(item.variant_id, 'quantity', Number(e.target.value))}
                                                        className="w-full text-center py-1 border border-slate-200 rounded-lg text-sm font-bold"
                                                    />
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <input 
                                                        type="number" 
                                                        value={item.price}
                                                        onChange={(e) => updateItem(item.variant_id, 'price', Number(e.target.value))}
                                                        className="w-full text-right py-1 px-2 border border-slate-200 rounded-lg text-sm font-bold"
                                                    />
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button onClick={() => removeItem(item.variant_id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
