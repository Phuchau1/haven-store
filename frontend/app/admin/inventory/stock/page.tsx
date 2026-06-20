'use client';

import React, { useState, useEffect } from 'react';
import { Download, Search, Printer, QrCode, Type } from 'lucide-react';
import Barcode from 'react-barcode';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx';

export default function StockVariantManager() {
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [printMode, setPrintMode] = useState<'barcode'|'qrcode'>('barcode');
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    useEffect(() => {
        fetch('/api/inventory/stock')
            .then(res => res.json())
            .then(data => {
                if (data.success) setVariants(data.data);
            })
            .finally(() => setLoading(false));
    }, []);

    const filteredVariants = variants.filter(v => 
        v.sku?.toLowerCase().includes(search.toLowerCase()) || 
        v.product_name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredVariants.map(v => ({
            'Sản phẩm': v.product_name,
            'Mã SKU': v.sku,
            'Màu': v.color_id,
            'Size': v.size_id,
            'Tồn kho': v.stock,
            'Giá bán': v.price
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ton_Kho");
        XLSX.writeFile(wb, "Danh_Sach_Ton_Kho.xlsx");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Quản lý Tồn kho Chi tiết (Biến thể)</h2>
                    <p className="text-sm text-slate-500">Xem và in mã vạch / QR Code cho từng biến thể sản phẩm.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200"
                    >
                        <Download size={16} /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden print:hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm theo mã SKU hoặc Tên sản phẩm..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Sản phẩm</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Phân loại</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Mã SKU</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Tồn kho</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Giá bán</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">In tem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4 text-slate-500">Đang tải...</td></tr>
                            ) : filteredVariants.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-4 text-slate-500">Không tìm thấy dữ liệu.</td></tr>
                            ) : (
                                filteredVariants.map(variant => (
                                    <tr key={variant.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                    {variant.image && variant.image !== '/products/placeholder.jpg' ? (
                                                        <img 
                                                            src={variant.image} 
                                                            alt={variant.product_name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).onerror = null;
                                                                (e.target as HTMLImageElement).src = '';
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">${variant.product_name?.charAt(0) || '?'}</div>`;
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 text-sm font-bold">
                                                            {variant.product_name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">{variant.product_name}</p>
                                                    <p className="text-xs text-slate-500">{variant.brand && variant.brand !== 'N/A' ? variant.brand : variant.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{variant.color_id}</span>
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{variant.size_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-indigo-600">{variant.sku}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`font-bold ${variant.stock <= 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                                                {variant.stock}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                                            {variant.price?.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => setSelectedVariant(variant)}
                                                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                                title="In mã Barcode/QR"
                                            >
                                                <Printer size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal in mã */}
            {selectedVariant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">In Tem Sản Phẩm</h3>
                            <button onClick={() => setSelectedVariant(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        
                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                            <button 
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${printMode === 'barcode' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                onClick={() => setPrintMode('barcode')}
                            >
                                <Type size={16} /> Barcode
                            </button>
                            <button 
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${printMode === 'qrcode' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                onClick={() => setPrintMode('qrcode')}
                            >
                                <QrCode size={16} /> QR Code
                            </button>
                        </div>

                        <div className="flex justify-center items-center bg-slate-50 p-8 rounded-2xl mb-6 border border-slate-100">
                            {printMode === 'barcode' ? (
                                <Barcode value={selectedVariant.barcode || selectedVariant.sku} width={1.5} height={60} fontSize={14} />
                            ) : (
                                <QRCodeCanvas value={selectedVariant.qr_code || selectedVariant.sku} size={150} level={"H"} />
                            )}
                        </div>

                        <p className="text-center text-sm text-slate-500 mb-6">
                            {selectedVariant.product_name} - {selectedVariant.color_id} ({selectedVariant.size_id})
                        </p>

                        <button 
                            onClick={handlePrint}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            <Printer size={18} /> In Tem Ngay
                        </button>
                    </div>
                </div>
            )}

            {/* Print Section (Only visible when printing) */}
            <div className="hidden print:block text-center mt-10">
                {selectedVariant && (
                    <div className="inline-block p-4 border border-black rounded-lg">
                        <div className="font-bold text-sm mb-2">{selectedVariant.product_name}</div>
                        <div className="text-xs mb-4">Màu: {selectedVariant.color_id} | Size: {selectedVariant.size_id}</div>
                        <div className="flex justify-center">
                            {printMode === 'barcode' ? (
                                <Barcode value={selectedVariant.barcode || selectedVariant.sku} width={2} height={80} fontSize={16} />
                            ) : (
                                <QRCodeCanvas value={selectedVariant.qr_code || selectedVariant.sku} size={200} level={"H"} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
