'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Printer, QrCode, Type, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Barcode from 'react-barcode';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx';

interface StockItem {
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    barcode: string;
    size_id: string;
    color_id: string;
    price: number;
    stock: number;           // Tồn thực tế
    reserved_stock: number;  // Đang giữ
    available_stock: number; // Có thể bán
    status: string;
    image: string;
    category: string;
}

export default function StockVariantManager() {
    const [variants, setVariants] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
    const [printMode, setPrintMode] = useState<'barcode'|'qrcode'>('barcode');
    const [selectedVariant, setSelectedVariant] = useState<StockItem | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/stock`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setVariants(data.data);
            })
            .catch(() => {
                // fallback dùng proxy
                fetch('/api/inventory/stock')
                    .then(res => res.json())
                    .then(data => { if (data.success) setVariants(data.data); });
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredVariants = useMemo(() => {
        let result = variants;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(v =>
                v.sku?.toLowerCase().includes(q) ||
                v.product_name?.toLowerCase().includes(q) ||
                v.color_id?.toLowerCase().includes(q) ||
                v.size_id?.toLowerCase().includes(q)
            );
        }
        if (filterStatus === 'low') result = result.filter(v => v.available_stock > 0 && v.available_stock <= 10);
        if (filterStatus === 'out') result = result.filter(v => v.available_stock <= 0);
        return result;
    }, [variants, search, filterStatus]);

    const stats = useMemo(() => ({
        total: variants.length,
        totalStock: variants.reduce((s, v) => s + v.stock, 0),
        totalReserved: variants.reduce((s, v) => s + (v.reserved_stock || 0), 0),
        totalAvailable: variants.reduce((s, v) => s + (v.available_stock || 0), 0),
        lowStock: variants.filter(v => v.available_stock > 0 && v.available_stock <= 10).length,
        outStock: variants.filter(v => v.available_stock <= 0).length,
    }), [variants]);

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredVariants.map(v => ({
            'Tên sản phẩm': v.product_name,
            'Mã SKU': v.sku,
            'Màu sắc': v.color_id,
            'Kích cỡ': v.size_id,
            'Tồn thực tế': v.stock,
            'Đang giữ (Reserved)': v.reserved_stock || 0,
            'Có thể bán': v.available_stock || 0,
            'Giá bán': v.price,
            'Trạng thái': v.available_stock <= 0 ? 'Hết hàng' : v.available_stock <= 10 ? 'Sắp hết' : 'Còn hàng'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ton_Kho");
        XLSX.writeFile(wb, "Danh_Sach_Ton_Kho.xlsx");
    };

    const getStockBadge = (available: number) => {
        if (available <= 0)  return <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full"><XCircle size={10} />Hết hàng</span>;
        if (available <= 10) return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><AlertTriangle size={10} />Sắp hết</span>;
        return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle size={10} />Còn hàng</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quản lý Tồn kho</h2>
                    <p className="text-sm text-slate-500">Danh sách biến thể sản phẩm đang có trong kho.</p>
                </div>
                <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                >
                    <Download size={16} /> Xuất Excel
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                {[
                    { label: 'Tổng biến thể',     value: stats.total,                                       color: 'indigo', icon: Package },
                    { label: 'Tồn thực tế',       value: stats.totalStock.toLocaleString('vi-VN') + ' sp',  color: 'blue',   icon: Package },
                    { label: 'Đang giữ chỗ',      value: stats.totalReserved.toLocaleString('vi-VN') + ' sp', color: 'violet', icon: Package },
                    { label: 'Có thể bán',        value: stats.totalAvailable.toLocaleString('vi-VN') + ' sp', color: 'emerald', icon: Package },
                    { label: 'Sắp hết hàng',      value: stats.lowStock,                                    color: 'amber',  icon: AlertTriangle },
                    { label: 'Hết hàng',          value: stats.outStock,                                    color: 'rose',   icon: XCircle },
                ].map((s, i) => (
                    <div key={i} className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm`}>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-extrabold mt-1 text-${s.color}-600`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print:hidden">
                {/* Filter bar */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm tên SP, mã SKU, màu sắc, kích cỡ..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'all', label: 'Tất cả' },
                            { key: 'low', label: '⚠️ Sắp hết' },
                            { key: 'out', label: '🚫 Hết hàng' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterStatus(f.key as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterStatus === f.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Hiển thị {filteredVariants.length}/{variants.length}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Sản phẩm</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Phân loại</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã SKU</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                                    <span className="text-blue-600">Tồn thực tế</span>
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                                    <span className="text-violet-600">Đang giữ</span>
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">
                                    <span className="text-emerald-600">Có thể bán</span>
                                </th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Giá bán</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Trạng thái</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">In tem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(10)].map((_, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 bg-slate-100 animate-pulse rounded-lg" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredVariants.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-slate-400">
                                        <Package className="mx-auto mb-2 text-slate-200" size={36} />
                                        <p>Không tìm thấy dữ liệu phù hợp.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredVariants.map(variant => (
                                    <tr key={variant.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                    {variant.image && variant.image !== '/products/placeholder.jpg' ? (
                                                        <img
                                                            src={variant.image}
                                                            alt={variant.product_name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const el = e.target as HTMLImageElement;
                                                                el.style.display = 'none';
                                                                if (el.parentElement) el.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#EEF2FF;color:#6366F1;font-weight:700;font-size:14px">${variant.product_name?.charAt(0) || '?'}</div>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-bold text-sm">
                                                            {variant.product_name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm leading-tight">{variant.product_name}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{variant.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-semibold">{variant.color_id}</span>
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-semibold">{variant.size_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[120px] truncate">{variant.sku}</td>
                                        {/* Tồn thực tế */}
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-lg font-extrabold text-blue-600">
                                                {variant.stock}
                                            </span>
                                        </td>
                                        {/* Đang giữ */}
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-lg font-extrabold ${(variant.reserved_stock || 0) > 0 ? 'text-violet-600' : 'text-slate-300'}`}>
                                                {variant.reserved_stock || 0}
                                            </span>
                                        </td>
                                        {/* Có thể bán */}
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-lg font-extrabold ${
                                                variant.available_stock <= 0 ? 'text-rose-600' :
                                                variant.available_stock <= 10 ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                                {variant.available_stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-700 text-sm">
                                            {variant.price?.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="px-4 py-3 text-center">{getStockBadge(variant.available_stock)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedVariant(variant)}
                                                className="p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                                                title="In mã Barcode/QR"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal In Tem */}
            {selectedVariant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={() => setSelectedVariant(null)}>
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">In Tem Sản Phẩm</h3>
                            <button onClick={() => setSelectedVariant(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>

                        <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-xl">
                            {[{ k: 'barcode', label: 'Barcode', icon: Type }, { k: 'qrcode', label: 'QR Code', icon: QrCode }].map(m => (
                                <button key={m.k}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${printMode === m.k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    onClick={() => setPrintMode(m.k as any)}
                                >
                                    <m.icon size={15} /> {m.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center items-center bg-slate-50 p-6 rounded-2xl mb-4 border border-slate-100">
                            {printMode === 'barcode' ? (
                                <Barcode value={selectedVariant.barcode || selectedVariant.sku || 'NOSKUCODE'} width={1.5} height={60} fontSize={12} />
                            ) : (
                                <QRCodeCanvas value={selectedVariant.barcode || selectedVariant.sku || 'NOSKUCODE'} size={140} level="H" />
                            )}
                        </div>

                        <div className="text-center mb-5">
                            <p className="font-semibold text-slate-800 text-sm">{selectedVariant.product_name}</p>
                            <p className="text-xs text-slate-500">{selectedVariant.color_id} / {selectedVariant.size_id} • SKU: {selectedVariant.sku}</p>
                            <p className="text-sm font-bold text-indigo-600 mt-1">{selectedVariant.price?.toLocaleString('vi-VN')}đ</p>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            <Printer size={18} /> In Tem Ngay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
