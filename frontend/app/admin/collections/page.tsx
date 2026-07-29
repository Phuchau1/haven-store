'use client';
import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface Collection {
    _id: string;
    name: string;
    slug: string;
    banner?: string;
    description?: string;
    productIds?: string[];
    isFeatured?: boolean;
}

export default function CollectionsAdminPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/collections');
            const data = await res.json();
            if (data.success) {
                setCollections(data.collections);
            }
        } catch (error) {
            toast.error('Lỗi khi tải bộ sưu tập');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Vui lòng nhập tên bộ sưu tập');
        try {
            const res = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isFeatured })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã tạo bộ sưu tập thành công!');
                setName('');
                setDescription('');
                setIsFeatured(false);
                fetchCollections();
            }
        } catch (error) {
            toast.error('Lỗi khi tạo bộ sưu tập');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa bộ sưu tập này?')) return;
        try {
            const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Đã xóa bộ sưu tập');
                fetchCollections();
            }
        } catch (error) {
            toast.error('Lỗi khi xóa bộ sưu tập');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        Quản Lý Bộ Sưu Tập (Collections)
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Quản lý bộ sưu tập theo mùa & sự kiện (Summer 2026, Limited, New Arrival...)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tạo BST */}
                <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Thêm Bộ Sưu Tập Mới</h3>
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Tên bộ sưu tập *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="vd: Summer 2026, New Arrival, Limited Edition..."
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả BST</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Mô tả chủ đề bộ sưu tập..."
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="feat"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="rounded text-blue-600"
                        />
                        <label htmlFor="feat" className="text-xs font-semibold text-gray-700">Nổi bật trên Trang Chủ</label>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <Plus size={16} /> Thêm Bộ Sưu Tập
                    </button>
                </form>

                {/* Danh Sách BST */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Danh Sách Bộ Sưu Tập ({collections.length})</h3>
                    {loading ? (
                        <p className="text-xs text-gray-500 py-4 text-center">Đang tải bộ sưu tập...</p>
                    ) : collections.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">Chưa có bộ sưu tập nào.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {collections.map((c) => (
                                <div key={c._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-extrabold text-gray-900">{c.name}</p>
                                            {c.isFeatured && (
                                                <span className="bg-amber-10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Sparkles size={10} /> Nổi bật
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500">Slug: {c.slug}</p>
                                        {c.description && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{c.description}</p>}
                                    </div>
                                    <button onClick={() => handleDelete(c._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
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
