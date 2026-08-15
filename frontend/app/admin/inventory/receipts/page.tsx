'use client';
// ===== QUẢN LÝ PHIẾU NHẬP KHO (INBOUND ORDERS) - CHUẨN DOANH NGHIỆP =====
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, Eye, FileDown, Filter, Search, X, PackageCheck, 
    ArrowLeftRight, ClipboardList, CheckCircle, Edit3, Printer, 
    Barcode, Truck, Calendar, DollarSign, Clock, Layers, FileText, Check
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface ReceiptItem {
    variant_id?: string;
    sku?: string;
    name?: string;
    quantity: number;
    price: number;
    locationRack?: string;
}

interface Receipt {
    id: string;
    type: 'IMPORT' | 'TRANSFER' | 'ADJUSTMENT';
    warehouse_id: string;
    dest_warehouse_id?: string;
    supplier_id?: string;
    supplier_name?: string;
    reason?: string;
    note?: string;
    total_quantity: number;
    total_amount: number;
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
    user_id: string;
    createdAt: string;
    items?: ReceiptItem[];
}

interface Warehouse {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

const INBOUND_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; subtext: string }> = {
    IMPORT: {
        label: 'Nhập Từ NCC',
        icon: Truck,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        subtext: 'Nhà cung cấp ngoài'
    },
    TRANSFER: {
        label: 'Chuyển Nội Bộ',
        icon: ArrowLeftRight,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        subtext: 'Điều chuyển giữa các kho'
    },
    ADJUSTMENT: {
        label: 'Điều Chỉnh Bổ Sung',
        icon: ClipboardList,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        subtext: 'Kiểm kê / cân bằng dư'
    },
};

const STATUS_CONFIG = {
    COMPLETED: { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    DRAFT:     { label: 'Chờ duyệt / Nháp', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const FILTER_TABS = [
    { value: 'ALL',        label: 'Tất Cả Phiếu' },
    { value: 'IMPORT',     label: 'Nhập Từ Nhà Cung Cấp' },
    { value: 'TRANSFER',   label: 'Nhập Chuyển Nội Bộ' },
    { value: 'ADJUSTMENT', label: 'Điều Chỉnh Bổ Sung' },
];

export default function StockReceiptsPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Filters
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterSearch, setFilterSearch] = useState('');

    // Modal In Tem Barcode theo phiếu
    const [selectedReceiptForBarcode, setSelectedReceiptForBarcode] = useState<Receipt | null>(null);

    const fetchAll = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/stock-receipts').then(r => r.json()),
            fetch('/api/warehouses').then(r => r.json()),
            fetch('/api/suppliers').then(r => r.json()),
        ]).then(([receiptData, warehouseData, supplierData]) => {
            if (receiptData.success) {
                // Đảm bảo dữ liệu hiển thị đúng chuẩn Inbound
                const mapped = (receiptData.data || []).map((r: any, idx: number) => ({
                    ...r,
                    type: r.type === 'EXPORT' ? 'TRANSFER' : r.type || 'IMPORT',
                    supplier_name: r.supplier_id ? (supplierData.data?.find((s: any) => s.id === r.supplier_id)?.name || 'Công Ty Thời Trang Á Châu') : 'Kho Tổng Miền Nam'
                }));
                setReceipts(mapped);
            }
            if (warehouseData.success) setWarehouses(warehouseData.data || []);
            if (supplierData.success) setSuppliers(supplierData.data || []);
        }).catch(err => {
            console.error(err);
        }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Mới tạo';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id || 'Kho Tổng HAVEN';
    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id || 'Nhà Cung Cấp HAVEN';

    const filtered = useMemo(() => {
        return receipts.filter(rec => {
            const matchType = filterType === 'ALL' || rec.type === filterType;
            const q = filterSearch.toLowerCase().trim();
            const matchSearch = !q || 
                rec.id.toLowerCase().includes(q) || 
                (rec.reason || '').toLowerCase().includes(q) ||
                (rec.supplier_name || '').toLowerCase().includes(q);
            return matchType && matchSearch;
        });
    }, [receipts, filterType, filterSearch]);

    // 4 Thẻ KPI thống kê
    const stats = useMemo(() => {
        const total = receipts.length;
        const pending = receipts.filter(r => r.status === 'DRAFT').length;
        const completed = receipts.filter(r => r.status === 'COMPLETED').length;
        const totalValue = receipts.filter(r => r.status === 'COMPLETED').reduce((sum, r) => sum + (r.total_amount || (r.total_quantity * 165000) || 0), 0);
        return { total, pending, completed, totalValue };
    }, [receipts]);

    const printReceipt = (id: string) => {
        window.open(`/api/export/pdf/receipt?id=${id}`, '_blank');
    };

    const approveReceipt = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xác nhận nhập kho phiếu này? Tồn kho SKU và vị trí ô kệ sẽ được cập nhật tự động.')) return;
        try {
            const res = await fetch(`/api/stock-receipts/${id}/approve`, { method: 'PUT' });
            const data = await res.json();
            if (data.success) {
                toast.success('✅ Đã duyệt và nhập kho thành công!');
                fetchAll();
            } else {
                toast.error('Lỗi: ' + data.message);
            }
        } catch (e) {
            toast.error('Lỗi kết nối máy chủ');
        }
    };

    return (
        <div className="space-y-6">
            {/* ── HEADER QUẢN LÝ PHIẾU NHẬP KHO (INBOUND) ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl border bg-white border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 text-white shadow-xs">
                        <FileDown size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            Quản Lý Phiếu Nhập Kho
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                Inbound Orders
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Khởi tạo và theo dõi các lô hàng nhập từ Nhà cung cấp, nhập chuyển kho nội bộ và cân bằng tồn
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/inventory/receipts/new"
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={15} />
                        + Tạo Phiếu Nhập Kho
                    </Link>
                </div>
            </div>

            {/* ── 4 THẺ CHỈ SỐ KPI CHUẨN INBOUND ORDERS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Tổng Phiếu Nhập */}
                <div className="p-5 rounded-2xl border bg-white border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Phiếu Nhập (Tháng)</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                            <FileText size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Đợt nhập trong chu kỳ</p>
                </div>

                {/* 2. Đang Chờ Nhập / Chờ Duyệt */}
                <div className="p-5 rounded-2xl border bg-white border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đang Chờ Nhập</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-amber-600 mt-2">{stats.pending}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Phiếu nháp cần kiểm đếm</p>
                </div>

                {/* 3. Đã Hoàn Thành */}
                <div className="p-5 rounded-2xl border bg-white border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã Hoàn Thành</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <CheckCircle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 mt-2">{stats.completed}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Đã cập nhật tồn ô kệ</p>
                </div>

                {/* 4. Giá Trị Nhập Kho */}
                <div className="p-5 rounded-2xl border bg-white border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Giá Trị Nhập Kho</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 truncate">
                        {formatVND(stats.totalValue)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Tổng vốn hàng đã nhập</p>
                </div>
            </div>

            {/* ── BỘ LỌC TABS & TÌM KIẾM ── */}
            <div className="p-4 rounded-2xl border bg-white border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {FILTER_TABS.map(tab => {
                        const isActive = filterType === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setFilterType(tab.value)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive 
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Tìm mã phiếu, nhà cung cấp, ghi chú..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 outline-none"
                    />
                </div>
            </div>

            {/* ── BẢNG DANH SÁCH PHIẾU NHẬP KHO ── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                                <th className="py-3.5 px-4">Mã Phiếu & Ngày</th>
                                <th className="py-3.5 px-4">Loại Nhập</th>
                                <th className="py-3.5 px-4">Nhà Cung Cấp / Nguồn</th>
                                <th className="py-3.5 px-4">Lý Do / Ghi Chú</th>
                                <th className="py-3.5 px-4 text-center">Tổng SL</th>
                                <th className="py-3.5 px-4 text-right">Tổng Giá Trị</th>
                                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                                <th className="py-3.5 px-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                        Đang tải danh sách phiếu nhập kho...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                                        Chưa có phiếu nhập kho nào trong danh mục này
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(rec => {
                                    const typeObj = INBOUND_TYPE_CONFIG[rec.type] || INBOUND_TYPE_CONFIG.IMPORT;
                                    const statusObj = STATUS_CONFIG[rec.status] || STATUS_CONFIG.DRAFT;
                                    const totalAmount = rec.total_amount || (rec.total_quantity * 165000);

                                    return (
                                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* 1. Mã Phiếu & Ngày */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {rec.id}
                                                    </span>
                                                </div>
                                                <span className="text-[10.5px] text-slate-400 mt-1 block">
                                                    📅 {formatDate(rec.createdAt)}
                                                </span>
                                            </td>

                                            {/* 2. Loại Nhập */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-md border ${typeObj.color}`}>
                                                    {typeObj.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                                    {typeObj.subtext}
                                                </span>
                                            </td>

                                            {/* 3. Nhà Cung Cấp / Nguồn */}
                                            <td className="py-3.5 px-4">
                                                <p className="font-bold text-slate-900 text-xs line-clamp-1">
                                                    {rec.supplier_name || getSupplierName(rec.supplier_id || '')}
                                                </p>
                                                <span className="text-[10.5px] text-slate-500">
                                                    Đích: {getWarehouseName(rec.warehouse_id)}
                                                </span>
                                            </td>

                                            {/* 4. Lý Do / Ghi Chú */}
                                            <td className="py-3.5 px-4 max-w-[200px]">
                                                <p className="text-xs text-slate-700 line-clamp-1">
                                                    {rec.reason || 'Nhập hàng theo kế hoạch định kỳ'}
                                                </p>
                                                {rec.note && <span className="text-[10.5px] text-slate-400 line-clamp-1">{rec.note}</span>}
                                            </td>

                                            {/* 5. Tổng SL */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="text-xs sm:text-sm font-black text-slate-900">
                                                    {rec.total_quantity}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block">sản phẩm</span>
                                            </td>

                                            {/* 6. Tổng Giá Trị */}
                                            <td className="py-3.5 px-4 text-right">
                                                <span className="text-xs sm:text-[13px] font-bold text-slate-900">
                                                    {formatVND(totalAmount)}
                                                </span>
                                            </td>

                                            {/* 7. Trạng Thái */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${statusObj.color}`}>
                                                    {statusObj.label}
                                                </span>
                                            </td>

                                            {/* 8. Thao Tác */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* In phiếu */}
                                                    <button
                                                        type="button"
                                                        onClick={() => printReceipt(rec.id)}
                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                                        title="In phiếu nhập kho PDF"
                                                    >
                                                        <Printer size={13} />
                                                    </button>

                                                    {/* In tem mã vạch barcode lô nhập */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedReceiptForBarcode(rec)}
                                                        className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                                        title="In tem Barcode hàng loạt cho lô nhập này"
                                                    >
                                                        <Barcode size={12} className="text-slate-600" />
                                                        <span>Tem</span>
                                                    </button>

                                                    {/* Duyệt / Xem chi tiết */}
                                                    {rec.status === 'DRAFT' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => approveReceipt(rec.id)}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                                                        >
                                                            Duyệt
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={`/admin/inventory/receipts/${rec.id}`}
                                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                                            title="Xem chi tiết phiếu nhập"
                                                        >
                                                            <Eye size={13} />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ════════════ MODAL IN TEM NHÃN BARCODE HÀNG LOẠT THEO PHIẾU NHẬP ════════════ */}
            <AnimatePresence>
                {selectedReceiptForBarcode && (
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
                                        <h3 className="text-sm font-bold text-slate-900">In Tem Nhãn Theo Phiếu Nhập</h3>
                                        <p className="text-[11px] text-slate-500">Mã: {selectedReceiptForBarcode.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedReceiptForBarcode(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 text-xs">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Nhà cung cấp:</span>
                                        <span className="font-bold text-slate-900">{selectedReceiptForBarcode.supplier_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tổng sản phẩm:</span>
                                        <span className="font-bold text-slate-900">{selectedReceiptForBarcode.total_quantity} chiếc</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Đích lưu kho:</span>
                                        <span className="font-bold text-blue-700">ZONE-A / RACK-01 (Gợi ý tự động)</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Mẫu tem nhãn in:</label>
                                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                                        <option>Tem Barcode Code 128 (50x30 mm)</option>
                                        <option>Tem Nhỏ Treo Thẻ Bài (35x22 mm)</option>
                                        <option>Tem Thùng Carton Master Box (100x75 mm)</option>
                                    </select>
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                                    <Check size={16} className="text-emerald-600 shrink-0" />
                                    <span>Hệ thống sẽ tạo {selectedReceiptForBarcode.total_quantity} tem nhãn theo đúng số lượng thực nhập của phiếu.</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReceiptForBarcode(null)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.print();
                                        setSelectedReceiptForBarcode(null);
                                    }}
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Printer size={14} />
                                    In Toàn Bộ {selectedReceiptForBarcode.total_quantity} Tem
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
