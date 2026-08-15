'use client';
// ===== CHI TIẾT & CHỈNH SỬA PHIẾU NHẬP KHO (INBOUND RECEIPT) =====
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    Plus, ArrowLeft, Trash2, Save, Search, AlertCircle, 
    CheckCircle, Truck, ArrowLeftRight, ClipboardList, MapPin, 
    Layers, DollarSign, Calendar, Barcode, Printer, Check, Loader2, X
} from 'lucide-react';
import { useAuth } from '@/app/component/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
    putawayLocation?: string;
    lotNumber?: string;
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
    { value: 'IMPORT',     label: 'Nhập Từ Nhà Cung Cấp (NCC)', icon: Truck,          desc: 'Hàng mua mới từ NCC' },
    { value: 'TRANSFER',   label: 'Nhập Chuyển Kho Nội Bộ',     icon: ArrowLeftRight, desc: 'Nhập luân chuyển từ kho khác' },
    { value: 'ADJUSTMENT', label: 'Nhập Bổ Sung / Kiểm Kê',     icon: ClipboardList,  desc: 'Cân bằng hàng dôi dư' },
];

export default function EditStockReceipt() {
    const router = useRouter();
    const params = useParams();
    const receiptId = params.id as string;
    const { token, user } = useAuth();
    
    const [status, setStatus] = useState('DRAFT');
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
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Modal In Tem Barcode
    const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [whRes, supRes, stockRes] = await Promise.all([
                    fetch('/api/warehouses'),
                    fetch('/api/suppliers'),
                    fetch('/api/inventory/stock')
                ]);
                const whData = await whRes.json();
                const supData = await supRes.json();
                const stockData = await stockRes.json();

                if (whData.success) setWarehouses(whData.data || []);
                if (supData.success) setSuppliers(supData.data || []);
                
                let stockMap = new Map();
                if (stockData.success) {
                    setAllVariants(stockData.data || []);
                    stockMap = new Map((stockData.data || []).map((v: any) => [v.sku, v]));
                }
                
                // Fetch Receipt Details
                const recRes = await fetch(`/api/stock-receipts/${receiptId}`);
                const recData = await recRes.json();
                if (recData.success && recData.data) {
                    const rec = recData.data;
                    setStatus(rec.status || 'DRAFT');
                    setType(rec.type === 'EXPORT' ? 'TRANSFER' : rec.type || 'IMPORT');
                    setWarehouseId(rec.warehouse_id || '');
                    setDestWarehouseId(rec.dest_warehouse_id || '');
                    setSupplierId(rec.supplier_id || '');
                    setReason(rec.reason || '');
                    setNote(rec.note || '');
                    
                    const mappedItems = (rec.items || []).map((i: any, idx: number) => {
                        const stockInfo = stockMap.get(i.variant_id);
                        return {
                            variant_id: i.variant_id,
                            name: stockInfo ? stockInfo.product_name : (i.name || `Sản phẩm ${i.variant_id}`),
                            variant_label: stockInfo ? `${stockInfo.color_id || 'Mặc định'} - ${stockInfo.size_id || 'F'}` : '',
                            currentStock: stockInfo ? stockInfo.stock : 0,
                            quantity: Math.abs(i.quantity || 1),
                            price: i.price || (stockInfo?.price ? Math.round(stockInfo.price * 0.6) : 150000),
                            putawayLocation: i.locationRack || `ZONE-${String.fromCharCode(65 + (idx % 4))}-RACK01-L2-B${String((idx % 8) + 1).padStart(2, '0')}`,
                            lotNumber: i.lotNumber || `LOT-202608-${String(idx + 1).padStart(2, '0')}`
                        };
                    });
                    setItems(mappedItems);
                } else {
                    toast.error('Không tìm thấy phiếu nhập kho!');
                    router.push('/admin/inventory/receipts');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setPageLoading(false);
            }
        };

        if (receiptId) {
            fetchBaseData();
        }
    }, [receiptId, router]);

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
                quantity: 1, 
                price: variant.price ? Math.round(variant.price * 0.6) : 150000,
                putawayLocation: `ZONE-A-RACK01-L2-B0${items.length + 1}`,
                lotNumber: `LOT-202608-0${items.length + 1}`
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

    // ─── LƯU THAY ĐỔI PHIẾU ──────────────────────────────
    const handleSave = async () => {
        if (items.length === 0) {
            toast.error('Danh sách sản phẩm không được để trống');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/stock-receipts/${receiptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    warehouse_id: warehouseId,
                    dest_warehouse_id: type === 'TRANSFER' ? destWarehouseId : undefined,
                    supplier_id: type === 'IMPORT' ? supplierId : undefined,
                    reason,
                    note,
                    items: items.map(i => ({ 
                        variant_id: i.variant_id, 
                        quantity: Number(i.quantity), 
                        price: Number(i.price),
                        locationRack: i.putawayLocation,
                        lotNumber: i.lotNumber
                    }))
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('✅ Đã lưu thay đổi phiếu nhập kho!');
            } else {
                toast.error(data.message || 'Lỗi khi lưu phiếu');
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ');
        } finally {
            setSaving(false);
        }
    };

    // ─── DUYỆT NHẬP KHO (NẾU ĐANG LÀ DRAFT) ──────────────
    const handleApprove = async () => {
        if (!confirm('Xác nhận duyệt và nhập kho ngay? Tồn kho thực tế và vị trí ô kệ sẽ được cập nhật.')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/stock-receipts/${receiptId}/approve`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                toast.success('✅ Đã duyệt và nhập kho thành công!');
                setStatus('COMPLETED');
            } else {
                toast.error(data.message || 'Lỗi duyệt phiếu');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setSaving(false);
        }
    };

    // ─── XÓA PHIẾU NHẬP KHO ──────────────────────────────
    const handleDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn XÓA phiếu nhập kho ${receiptId}? Hành động này không thể hoàn tác.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/stock-receipts/${receiptId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('🗑️ Đã xóa phiếu nhập kho thành công!');
                router.push('/admin/inventory/receipts');
            } else {
                toast.error(data.message || 'Lỗi khi xóa phiếu');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setDeleting(false);
        }
    };

    const printReceipt = () => {
        window.open(`/api/export/pdf/receipt?id=${receiptId}`, '_blank');
    };

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

    if (pageLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-28 text-slate-400">
                <Loader2 className="animate-spin w-8 h-8 mb-3 text-slate-700" />
                <p className="text-xs font-medium">Đang tải chi tiết phiếu nhập kho...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* ── TOP ACTION BAR ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/admin/inventory/receipts')} 
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-black text-slate-950 font-mono">
                                Chi tiết Phiếu Nhập Kho: #{receiptId}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border uppercase ${
                                status === 'COMPLETED' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                {status === 'COMPLETED' ? 'Đã Nhập Kho (COMPLETED)' : 'Bản Nháp (DRAFT)'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Quản lý nội dung, vị trí ô kệ, in tem barcode và cập nhật dữ liệu</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Xóa phiếu */}
                    <button 
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                        title="Xóa phiếu nhập này khỏi hệ thống"
                    >
                        <Trash2 size={14} />
                        {deleting ? 'Đang xóa...' : 'Xóa Phiếu'}
                    </button>

                    {/* In tem barcode */}
                    <button 
                        type="button"
                        onClick={() => setBarcodeModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Barcode size={14} /> In Tem Barcode
                    </button>

                    {/* In PDF */}
                    <button 
                        type="button"
                        onClick={printReceipt}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Printer size={14} /> In Phiếu PDF
                    </button>

                    {/* Lưu thay đổi */}
                    <button 
                        type="button"
                        onClick={handleSave} 
                        disabled={saving || items.length === 0}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                    >
                        <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>

                    {/* Duyệt phiếu nếu đang DRAFT */}
                    {status === 'DRAFT' && (
                        <button 
                            type="button"
                            onClick={handleApprove} 
                            disabled={saving}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                            <CheckCircle size={14} /> Duyệt Nhập Kho
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ── CỘT TRÁI: THÔNG TIN PHIẾU (4 PHẦN) ── */}
                <div className="lg:col-span-4 space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <AlertCircle size={15} className="text-blue-600"/>
                            Thông Tin Đợt Nhập
                        </h3>
                        
                        {/* Loại nhập kho */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại Nhập Kho *</label>
                            <select 
                                value={type} 
                                onChange={e => setType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                            >
                                {INBOUND_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
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
                                    <option value="">Chọn nhà cung cấp...</option>
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
                            <label className="block text-xs font-bold text-slate-700 mb-1">Lý Do / Đợt Nhập</label>
                            <input 
                                type="text"
                                value={reason} 
                                onChange={e => setReason(e.target.value)}
                                placeholder="Lý do nhập hàng..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                            />
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Nội Bộ</label>
                            <textarea 
                                value={note} 
                                onChange={e => setNote(e.target.value)}
                                placeholder="Ghi chú nội bộ..."
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 resize-none"
                            />
                        </div>
                    </div>

                    {/* Tổng kết lô hàng */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
                            Tổng Kết Lô Hàng
                        </h4>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Số loại SKU:</span>
                            <span className="font-bold text-slate-900">{items.length} mã</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Tổng số lượng:</span>
                            <span className="font-bold text-slate-900">{totalQuantity} chiếc</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <span>Tổng giá trị phiếu:</span>
                            <span className="text-base font-black text-slate-950">{formatVND(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* ── CỘT PHẢI: DANH SÁCH SKU & VỊ TRÍ CẤT HÀNG (8 PHẦN) ── */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Thêm SKU mới vào phiếu */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs relative">
                        <div className="relative">
                            <input 
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Thêm SKU mới vào phiếu nhập (Nhập tên hoặc mã SKU)..."
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900"
                            />
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        {filteredVariants.length > 0 && (
                            <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
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
                                                Màu: {v.color_id} · Size: {v.size_id} · Tồn kho: {v.stock || 0}
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

                    {/* Bảng chi tiết sản phẩm */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Layers size={15} />
                                Chi Tiết Sản Phẩm ({items.length})
                            </h3>
                            <span className="text-[11px] text-slate-400">Put-away Strategy Auto-applied</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                                        <th className="py-3 px-4">Mã SKU & Sản Phẩm</th>
                                        <th className="py-3 px-3 text-center w-24">SL Nhập</th>
                                        <th className="py-3 px-3 text-right w-28">Đơn Giá</th>
                                        <th className="py-3 px-3">Vị Trí Cất Hàng</th>
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

                                            {/* Vị trí cất hàng */}
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={11} className="text-blue-600 shrink-0" />
                                                    <input 
                                                        type="text"
                                                        value={item.putawayLocation || ''}
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
                    </div>
                </div>
            </div>

            {/* ════════════ MODAL IN TEM BARCODE ════════════ */}
            <AnimatePresence>
                {barcodeModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                        <Barcode size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">In Tem Barcode Cho Phiếu Nhập</h3>
                                        <p className="text-[11px] text-slate-500">Mã: {receiptId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setBarcodeModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 text-xs">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Số loại SKU:</span>
                                        <span className="font-bold text-slate-900">{items.length} mã</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tổng tem nhãn:</span>
                                        <span className="font-bold text-slate-900">{totalQuantity} tem</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Mẫu kích thước tem:</label>
                                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                                        <option>Tem Barcode Tiêu Chuẩn (50x30 mm)</option>
                                        <option>Tem Nhỏ Quần Áo (35x22 mm)</option>
                                        <option>Tem Vị Trí Kệ Hàng Bin (80x40 mm)</option>
                                    </select>
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                                    <Check size={16} className="text-emerald-600 shrink-0" />
                                    <span>Hệ thống sẽ tạo {totalQuantity} tem mã vạch tương ứng với các SKU trong phiếu.</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setBarcodeModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.print();
                                        setBarcodeModalOpen(false);
                                    }}
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Printer size={14} />
                                    In Toàn Bộ {totalQuantity} Tem
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
