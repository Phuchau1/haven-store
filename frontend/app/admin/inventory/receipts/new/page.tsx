'use client';
// ===== KHỞI TẠO PHIẾU NHẬP KHO (INBOUND ORDER) - CHUẨN DOANH NGHIỆP =====
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, ArrowLeft, Trash2, Save, Search, AlertCircle, 
    CheckCircle, Truck, ArrowLeftRight, ClipboardList, MapPin, 
    Layers, DollarSign, Calendar, Barcode, Check
} from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { toast } from 'react-hot-toast';

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
    putawayLocation: string; // Vị trí gợi ý cất hàng
    lotNumber?: string;       // Mã lô hàng
    expDate?: string;         // Hạn sử dụng
}

interface Warehouse {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

const INBOUND_TYPES = [
    { value: 'IMPORT',     label: 'Nhập Từ Nhà Cung Cấp (NCC)', icon: Truck,           desc: 'Hàng mua mới từ NCC' },
    { value: 'TRANSFER',   label: 'Nhập Chuyển Kho Nội Bộ',     icon: ArrowLeftRight,  desc: 'Nhập luân chuyển từ kho khác' },
    { value: 'ADJUSTMENT', label: 'Nhập Bổ Sung / Kiểm Kê',     icon: ClipboardList,   desc: 'Cân bằng hàng dôi dư' },
];

export default function NewStockReceipt() {
    const router = useRouter();
    const { token, user } = useAuth();
    
    const [type, setType] = useState('IMPORT');
    const [warehouseId, setWarehouseId] = useState('');
    const [destWarehouseId, setDestWarehouseId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [reason, setReason] = useState('Nhập hàng theo kế hoạch định kỳ');
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
        fetch('/api/warehouses')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setWarehouses(data.data);
                    setWarehouseId(data.data[0].id);
                }
            });

        fetch('/api/suppliers')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setSuppliers(data.data);
                    setSupplierId(data.data[0].id);
                }
            });

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
        ).slice(0, 6);
        setFilteredVariants(filtered);
    }, [search, allVariants]);

    // Gợi ý vị trí cất hàng (Put-away Strategy)
    const generatePutawayLocation = (index: number) => {
        const zone = ['ZONE-A', 'ZONE-B', 'ZONE-C', 'ZONE-D'][index % 4];
        const rack = `RACK-${String((index % 8) + 1).padStart(2, '0')}`;
        const level = `L${(index % 3) + 1}`;
        const bin = `B${String((index % 10) + 1).padStart(2, '0')}`;
        return `${zone}-${rack}-${level}-${bin}`;
    };

    const addItem = (variant: VariantInfo) => {
        const existing = items.find(i => i.variant_id === variant.sku);
        if (existing) {
            setItems(items.map(i => i.variant_id === variant.sku ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, { 
                variant_id: variant.sku, 
                name: variant.product_name,
                variant_label: `${variant.color_id || 'Mặc định'} - ${variant.size_id || 'F'}`,
                currentStock: variant.stock || 0,
                quantity: 10, 
                price: variant.price ? Math.round(variant.price * 0.6) : 150000,
                putawayLocation: generatePutawayLocation(items.length),
                lotNumber: `LOT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(items.length + 1).padStart(2, '0')}`
            }]);
        }
        setSearch('');
    };

    const removeItem = (sku: string) => {
        setItems(items.filter(i => i.variant_id !== sku));
    };

    const updateItem = (sku: string, field: keyof ReceiptItem, value: any) => {
        setItems(items.map(i => i.variant_id === sku ? { ...i, [field]: value } : i));
    };

    const handleSave = async (status: 'DRAFT' | 'COMPLETED') => {
        if (items.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập');
            return;
        }
        if (!warehouseId) {
            toast.error('Vui lòng chọn kho nhập');
            return;
        }
        if (type === 'TRANSFER' && !destWarehouseId) {
            toast.error('Vui lòng chọn kho nguồn chuyển');
            return;
        }
        
        if (status === 'COMPLETED') {
            if (!confirm('Xác nhận duyệt và nhập kho ngay? Tồn kho thực tế và vị trí ô kệ sẽ được cập nhật.')) return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/stock-receipts`, {
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
                    status,
                    user_id: user?.id || 'admin',
                    items: items.map(i => ({ 
                        variant_id: i.variant_id, 
                        quantity: Number(i.quantity), 
                        price: Number(i.price),
                        locationRack: i.putawayLocation,
                        lotNumber: i.lotNumber,
                        expDate: i.expDate
                    }))
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('✅ Khởi tạo phiếu nhập kho thành công!');
                router.push('/admin/inventory/receipts');
            } else {
                toast.error('Lỗi: ' + data.message);
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    return (
        <div className="space-y-6 pb-20">
            {/* ── TOP ACTION BAR ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.back()} 
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            Tạo Phiếu Nhập Kho
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase">
                                Inbound
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">Khởi tạo đợt nhập hàng mới và phân bổ vị trí ô kệ cất hàng</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                        onClick={() => handleSave('DRAFT')} 
                        disabled={loading || items.length === 0}
                        className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                    >
                        <Save size={14} /> Lưu Nháp
                    </button>
                    <button 
                        onClick={() => handleSave('COMPLETED')} 
                        disabled={loading || items.length === 0}
                        className="flex items-center gap-1.5 bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                    >
                        <CheckCircle size={14} /> Xác Nhận & Nhập Kho
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ── CỘT TRÁI: THÔNG TIN PHIẾU NHẬP (4 PHẦN) ── */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <AlertCircle size={15} className="text-blue-600"/>
                            Thông Tin Đợt Nhập
                        </h3>
                        
                        {/* Loại nhập kho */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại Nhập Kho *</label>
                            <div className="grid grid-cols-1 gap-2">
                                {INBOUND_TYPES.map(t => {
                                    const isSelected = type === t.value;
                                    return (
                                        <div
                                            key={t.value}
                                            onClick={() => setType(t.value)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                                isSelected 
                                                    ? 'border-slate-900 bg-slate-50/80 shadow-xs' 
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                <t.icon size={15} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-900">{t.label}</p>
                                                <p className="text-[10.5px] text-slate-500">{t.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nhà cung cấp nếu là IMPORT */}
                        {type === 'IMPORT' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nhà Cung Cấp *</label>
                                <select 
                                    value={supplierId} 
                                    onChange={e => setSupplierId(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Kho đích nhận hàng */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Kho Tiếp Nhận (Đích) *</label>
                            <select 
                                value={warehouseId} 
                                onChange={e => setWarehouseId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                            >
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>

                        {/* Lý do nhập */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Lý Do / Đợt Nhập *</label>
                            <input 
                                type="text"
                                value={reason} 
                                onChange={e => setReason(e.target.value)}
                                placeholder="Ví dụ: Nhập hàng đợt 1 BST Thu Đông 2026..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                            />
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Đính Kèm</label>
                            <textarea 
                                value={note} 
                                onChange={e => setNote(e.target.value)}
                                placeholder="Ghi chú về tình trạng niêm phong, số container..."
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none"
                            />
                        </div>
                    </div>

                    {/* Tổng kết phiếu */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
                            Tổng Kết Lô Hàng
                        </h4>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Số loại SKU:</span>
                            <span className="font-bold text-slate-900">{items.length} mã</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Tổng số lượng nhập:</span>
                            <span className="font-bold text-slate-900">{totalQuantity} đơn vị</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <span>Tổng giá trị vốn:</span>
                            <span className="text-sm font-black text-slate-950">{formatVND(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* ── CỘT PHẢI: DANH SÁCH SẢN PHẨM & VỊ TRÍ CẤT HÀNG (8 PHẦN) ── */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Ô tìm kiếm và thêm sản phẩm SKU */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs relative">
                        <label className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                            <Search size={14} className="text-blue-600" />
                            Tìm và thêm SKU vào phiếu nhập:
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Nhập tên sản phẩm hoặc mã SKU (Ví dụ: HAVEN-SM01, Sơ mi...)"
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900"
                            />
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {/* Dropdown kết quả tìm kiếm */}
                        {filteredVariants.length > 0 && (
                            <div className="absolute left-5 right-5 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                                {filteredVariants.map(v => (
                                    <div 
                                        key={v.id || v.sku}
                                        onClick={() => addItem(v)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-xs bg-slate-100 px-1.5 py-0.2 rounded text-slate-900">{v.sku}</span>
                                                <span className="text-xs font-bold text-slate-800">{v.product_name}</span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-0.5 block">
                                                Màu: {v.color_id} · Size: {v.size_id} · Tồn hiện tại: {v.stock || 0}
                                            </span>
                                        </div>
                                        <button className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                                            <Plus size={12} /> Thêm
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bảng danh sách SKU trong phiếu nhập */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Layers size={15} />
                                Chi Tiết Sản Phẩm & Gợi Ý Vị Trí Ô Kệ ({items.length})
                            </h3>
                            <span className="text-[11px] text-slate-400">Put-away Strategy Auto-applied</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-xs font-medium">
                                Chưa có sản phẩm nào. Hãy tìm kiếm ở ô phía trên để thêm vào phiếu nhập kho.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                            <th className="py-3 px-4">Mã SKU & Tên</th>
                                            <th className="py-3 px-3 text-center w-24">SL Nhập</th>
                                            <th className="py-3 px-3 text-right w-28">Đơn Giá Nhập</th>
                                            <th className="py-3 px-3">Vị Trí Cất Hàng (Put-away)</th>
                                            <th className="py-3 px-3">Mã Lô (Lot)</th>
                                            <th className="py-3 px-3 text-right w-28">Thành Tiền</th>
                                            <th className="py-3 px-3 text-center w-12">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                        {items.map((item) => (
                                            <tr key={item.variant_id} className="hover:bg-slate-50/50">
                                                {/* SKU & Name */}
                                                <td className="py-3 px-4">
                                                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                                        {item.variant_id}
                                                    </span>
                                                    <p className="font-bold text-slate-900 text-xs mt-0.5 line-clamp-1">{item.name}</p>
                                                    <span className="text-[10.5px] text-slate-500">{item.variant_label}</span>
                                                </td>

                                                {/* Số lượng */}
                                                <td className="py-3 px-3 text-center">
                                                    <input 
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={e => updateItem(item.variant_id, 'quantity', Number(e.target.value))}
                                                        className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900 text-xs"
                                                    />
                                                </td>

                                                {/* Đơn giá */}
                                                <td className="py-3 px-3 text-right">
                                                    <input 
                                                        type="number"
                                                        min={0}
                                                        value={item.price}
                                                        onChange={e => updateItem(item.variant_id, 'price', Number(e.target.value))}
                                                        className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-medium text-slate-900 text-xs"
                                                    />
                                                </td>

                                                {/* Vị trí gợi ý cất hàng */}
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={11} className="text-blue-600 shrink-0" />
                                                        <input 
                                                            type="text"
                                                            value={item.putawayLocation}
                                                            onChange={e => updateItem(item.variant_id, 'putawayLocation', e.target.value)}
                                                            placeholder="ZONE-A-RACK01..."
                                                            className="w-32 px-2 py-1.5 bg-blue-50/60 border border-blue-200 rounded-lg font-mono font-bold text-[11px] text-blue-900"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Mã Lô */}
                                                <td className="py-3 px-3">
                                                    <input 
                                                        type="text"
                                                        value={item.lotNumber || ''}
                                                        onChange={e => updateItem(item.variant_id, 'lotNumber', e.target.value)}
                                                        placeholder="LOT-202608-01"
                                                        className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700"
                                                    />
                                                </td>

                                                {/* Thành tiền */}
                                                <td className="py-3 px-3 text-right font-bold text-slate-900">
                                                    {formatVND(item.quantity * item.price)}
                                                </td>

                                                {/* Xóa */}
                                                <td className="py-3 px-3 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeItem(item.variant_id)}
                                                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
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
