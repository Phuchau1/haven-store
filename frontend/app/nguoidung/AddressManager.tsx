'use client';
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Address {
    id: string;
    full_name: string;
    phone: string;
    city: string;
    district: string;
    ward: string;
    street: string;
    is_default: boolean;
}

interface AddressManagerProps {
    userId: string;
}

export default function AddressManager({ userId }: AddressManagerProps) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        city: '',
        district: '',
        ward: '',
        street: '',
        is_default: false
    });

    // API state for locations
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    
    // Selected codes for fetching
    const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
    const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);

    useEffect(() => {
        if (userId) fetchAddresses();
        fetchProvinces();
    }, [userId]);

    const fetchAddresses = async () => {
        try {
            const res = await fetch(`/api/addresses?user_id=${userId}`);
            const data = await res.json();
            if (data.success) {
                setAddresses(data.addresses);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách địa chỉ:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProvinces = async () => {
        try {
            const res = await fetch('https://provinces.open-api.vn/api/?depth=1');
            const data = await res.json();
            setProvinces(data);
        } catch (error) {
            console.error('Lỗi tải Tỉnh/Thành:', error);
        }
    };

    const fetchDistricts = async (provinceCode: number) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await res.json();
            setDistricts(data.districts || []);
        } catch (error) {
            console.error('Lỗi tải Quận/Huyện:', error);
        }
    };

    const fetchWards = async (districtCode: number) => {
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await res.json();
            setWards(data.wards || []);
        } catch (error) {
            console.error('Lỗi tải Phường/Xã:', error);
        }
    };

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = Number(e.target.value);
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedProvinceCode(code);
        setFormData({ ...formData, city: name, district: '', ward: '' });
        setDistricts([]);
        setWards([]);
        if (code) fetchDistricts(code);
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = Number(e.target.value);
        const name = e.target.options[e.target.selectedIndex].text;
        setSelectedDistrictCode(code);
        setFormData({ ...formData, district: name, ward: '' });
        setWards([]);
        if (code) fetchWards(code);
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.options[e.target.selectedIndex].text;
        setFormData({ ...formData, ward: name });
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone: '',
            city: '',
            district: '',
            ward: '',
            street: '',
            is_default: false
        });
        setEditingId(null);
        setSelectedProvinceCode(null);
        setSelectedDistrictCode(null);
        setDistricts([]);
        setWards([]);
    };

    const openModal = (addr?: Address) => {
        if (addr) {
            setEditingId(addr.id);
            setFormData({
                full_name: addr.full_name,
                phone: addr.phone,
                city: addr.city,
                district: addr.district,
                ward: addr.ward,
                street: addr.street,
                is_default: addr.is_default
            });
            // Try to load province/district to populate dropdowns
            const prov = provinces.find(p => p.name === addr.city);
            if (prov) {
                setSelectedProvinceCode(prov.code);
                fetch(`https://provinces.open-api.vn/api/p/${prov.code}?depth=2`)
                    .then(r => r.json())
                    .then(d => {
                        const dists = d.districts || [];
                        setDistricts(dists);
                        const dist = dists.find((di: any) => di.name === addr.district);
                        if (dist) {
                            setSelectedDistrictCode(dist.code);
                            fetch(`https://provinces.open-api.vn/api/d/${dist.code}?depth=2`)
                                .then(r => r.json())
                                .then(w => setWards(w.wards || []));
                        }
                    });
            }
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.city || !formData.district || !formData.ward || !formData.street) {
            alert('Vui lòng nhập đầy đủ địa chỉ!');
            return;
        }

        try {
            const method = editingId ? 'PUT' : 'POST';
            const payload = { ...formData, user_id: userId, id: editingId };

            const res = await fetch('/api/addresses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                fetchAddresses();
                setIsModalOpen(false);
                resetForm();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (error) {
            console.error('Lỗi lưu địa chỉ:', error);
            alert('Có lỗi xảy ra khi lưu địa chỉ.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
        try {
            const res = await fetch(`/api/addresses?id=${id}&user_id=${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchAddresses();
            }
        } catch (error) {
            console.error('Lỗi xóa:', error);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch('/api/addresses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, user_id: userId, is_default: true })
            });
            const data = await res.json();
            if (data.success) {
                fetchAddresses();
            }
        } catch (error) {
            console.error('Lỗi cập nhật mặc định:', error);
        }
    };

    if (loading) return <div className="animate-pulse h-20 bg-slate-100 rounded-xl"></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sổ địa chỉ ({addresses.length})</h4>
                <button 
                    type="button"
                    onClick={() => openModal()}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus size={14} /> Thêm địa chỉ mới
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl border-dashed">
                    <MapPin className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-500 font-medium">Bạn chưa lưu địa chỉ nào.</p>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`p-4 rounded-2xl border ${addr.is_default ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white'} relative group transition-all`}>
                            {addr.is_default && (
                                <span className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">Mặc định</span>
                            )}
                            
                            <div className="pr-16">
                                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    {addr.full_name} 
                                    <span className="text-slate-300">|</span> 
                                    <span className="text-slate-600 font-medium">{addr.phone}</span>
                                </p>
                                <p className="text-sm text-slate-600 mt-2">{addr.street}</p>
                                <p className="text-sm text-slate-600">{addr.ward}, {addr.district}, {addr.city}</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                {!addr.is_default ? (
                                    <button type="button" onClick={() => handleSetDefault(addr.id)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                                        Thiết lập mặc định
                                    </button>
                                ) : <div />}
                                
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => openModal(addr)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(addr.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-900">{editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Họ và tên</label>
                                        <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="Nhập họ tên" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Số điện thoại</label>
                                        <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="09xx xxx xxx" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tỉnh / Thành phố</label>
                                    <select required value={selectedProvinceCode || ''} onChange={handleProvinceChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                                        <option value="" disabled>Chọn Tỉnh/Thành phố</option>
                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Quận / Huyện</label>
                                        <select required disabled={!selectedProvinceCode} value={selectedDistrictCode || ''} onChange={handleDistrictChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-50">
                                            <option value="" disabled>Chọn Quận/Huyện</option>
                                            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Phường / Xã</label>
                                        <select required disabled={!selectedDistrictCode} value={formData.ward ? wards.find(w=>w.name===formData.ward)?.code || '' : ''} onChange={handleWardChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-50">
                                            <option value="" disabled>Chọn Phường/Xã</option>
                                            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Địa chỉ cụ thể</label>
                                    <input required type="text" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" placeholder="Số nhà, Tên đường..." />
                                </div>

                                {!formData.is_default && (
                                    <div className="pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                            <span className="text-sm font-medium text-slate-700">Đặt làm địa chỉ mặc định</span>
                                        </label>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                                        Hủy bỏ
                                    </button>
                                    <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
                                        <CheckCircle2 size={16} /> Lưu địa chỉ
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
