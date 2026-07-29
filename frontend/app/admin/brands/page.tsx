'use client';
import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface Brand {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    country?: string;
    order?: number;
}

export default function BrandsAdminPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [country, setCountry] = useState('Việt Nam');

    const fetchBrands = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/brands');
            const data = await res.json();
            if (data.success) {
                setBrands(data.brands);
            }
        } catch (error) {
            toast.error('Lỗi khi tải thương hiệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Vui lòng nhập tên thương hiệu');
        try {
            const res = await fetch('/api/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, country })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã thêm thương hiệu thành công!');
                setName('');
                setDescription('');
                fetchBrands();
            }
        } catch (error) {
            toast.error('Lỗi khi tạo thương hiệu');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;
        try {
            const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa thương hiệu');
                fetchBrands();
            }
        } catch (error) {
            toast.error('Lỗi khi xóa thương hiệu');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Quản Lý Thương Hiệu (Brands)
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Quản lý đối tác và hãng sản xuất (Nike, Adidas, Routine, HAVEN...)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tạo Thương Hiệu */}
                <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Thêm Thương Hiệu Mới</h3>
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Tên thương hiệu *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="vd: Nike, HAVEN, Routine..."
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Quốc gia xuất xứ</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="vd: Việt Nam, Mỹ, Nhật Bản..."
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Giới thiệu thương hiệu..."
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Plus size={16} /> Thêm Thương Hiệu
                    </button>
                </form>

                {/* Danh Sách Thương Hiệu */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Danh Sách Thương Hiệu ({brands.length})</h3>
                    {loading ? (
                        <p className="text-xs text-gray-500 py-4 text-center">Đang tải thương hiệu...</p>
                    ) : brands.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">Chưa có thương hiệu nào. Hãy tạo mới bên cạnh!</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {brands.map((b) => (
                                <div key={b._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-extrabold text-gray-900">{b.name}</p>
                                        <p className="text-[11px] text-gray-500">{b.country} • Slug: {b.slug}</p>
                                        {b.description && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{b.description}</p>}
                                    </div>
                                    <button onClick={() => handleDelete(b._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
