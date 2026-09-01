'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, ArrowDownLeft, ArrowUpRight, RotateCcw, 
    Building2, Plus, Trash2, QrCode, CheckCircle2, Clock, 
    XCircle, AlertCircle, X, Check, ShieldCheck, DollarSign,
    ExternalLink, Sparkles, AlertTriangle
} from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/app/component/AuthContext';

// Danh sách các ngân hàng Việt Nam phổ biến (Napas / VietQR)
const POPULAR_BANKS = [
    { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương Việt Nam' },
    { code: 'MB', shortName: 'MB Bank', name: 'Ngân hàng Quân Đội' },
    { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương Việt Nam' },
    { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu' },
    { code: 'ICB', shortName: 'VietinBank', name: 'Ngân hàng Công Thương Việt Nam' },
    { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư & Phát triển Việt Nam' },
    { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng' },
    { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong' },
    { code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín' },
    { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc Tế' },
    { code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM' },
    { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng Hàng Hải' },
    { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông' },
    { code: 'VBA', shortName: 'Agribank', name: 'Ngân hàng Nông Nghiệp & PT Nông Thôn' },
    { code: 'SHB', shortName: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội' },
    { code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng Lộc Phát Việt Nam' },
    { code: 'SEAB', shortName: 'SeABank', name: 'Ngân hàng Đông Nam Á' }
];

interface WalletTx {
    id: string;
    amount: number;
    description: string;
    type: string;
    status: string;
    orderId?: string;
    withdrawalRequestId?: string;
    createdAt: string;
}

interface WithdrawalReq {
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    bankInfo: {
        bankCode: string;
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    status: 'pending' | 'completed' | 'rejected' | 'approved';
    note?: string;
    adminNote?: string;
    createdAt: string;
}

interface SavedBank {
    id: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault?: boolean;
}

interface HavenWalletManagerProps {
    onBalanceChange?: (newBalance: number) => void;
}

export default function HavenWalletManager({ onBalanceChange }: HavenWalletManagerProps) {
    const { user, token } = useAuth();

    // Dữ liệu ví
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<WalletTx[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalReq[]>([]);
    const [savedBanks, setSavedBanks] = useState<SavedBank[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [subTab, setSubTab] = useState<'history' | 'withdrawals' | 'banks'>('history');

    // Modals
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToastMsg({ text, type });
        setTimeout(() => setToastMsg(null), 4000);
    };

    // Form rút tiền
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankCode: 'VCB',
        bankName: 'Vietcombank',
        accountNumber: '',
        accountHolder: '',
        note: '',
        saveBank: true,
        selectedSavedBankId: ''
    });

    // Form nạp tiền
    const [depositForm, setDepositForm] = useState({
        amount: 100000,
        paymentMethod: 'vietqr' as 'vietqr' | 'vnpay' | 'momo'
    });
    const [depositResult, setDepositResult] = useState<any>(null);

    // Form thêm tài khoản ngân hàng
    const [bankForm, setBankForm] = useState({
        bankCode: 'VCB',
        bankName: 'Vietcombank',
        accountNumber: '',
        accountHolder: ''
    });

    const onBalanceChangeRef = React.useRef(onBalanceChange);
    useEffect(() => {
        onBalanceChangeRef.current = onBalanceChange;
    }, [onBalanceChange]);

    // Tải toàn bộ dữ liệu ví
    const fetchWalletData = useCallback(async () => {
        if (!user?.id || !token) return;
        setLoading(true);
        try {
            const [walletRes, withdrawRes, banksRes] = await Promise.all([
                fetch('/api/wallet', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/wallet/withdrawals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/wallet/banks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const [walletData, withdrawData, banksData] = await Promise.all([
                walletRes.json(),
                withdrawRes.json(),
                banksRes.json()
            ]);

            if (walletData.success) {
                setBalance(walletData.walletBalance || 0);
                setTransactions(walletData.transactions || []);
                if (onBalanceChangeRef.current) {
                    onBalanceChangeRef.current(walletData.walletBalance || 0);
                }
            }
            if (withdrawData.success) {
                setWithdrawals(withdrawData.withdrawals || []);
            }
            if (banksData.success) {
                setSavedBanks(banksData.banks || []);
                // Điền mặc định ngân hàng đầu tiên nếu có
                if (banksData.banks?.length > 0 && !withdrawForm.selectedSavedBankId) {
                    const firstBank = banksData.banks[0];
                    setWithdrawForm(prev => ({
                        ...prev,
                        selectedSavedBankId: firstBank.id,
                        bankCode: firstBank.bankCode,
                        bankName: firstBank.bankName,
                        accountNumber: firstBank.accountNumber,
                        accountHolder: firstBank.accountHolder
                    }));
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải thông tin ví:', err);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, token]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    // Xử lý chọn tài khoản ngân hàng đã lưu
    const handleSelectSavedBank = (bankId: string) => {
        if (!bankId) {
            setWithdrawForm(prev => ({
                ...prev,
                selectedSavedBankId: '',
                accountNumber: '',
                accountHolder: ''
            }));
            return;
        }
        const found = savedBanks.find(b => b.id === bankId);
        if (found) {
            setWithdrawForm(prev => ({
                ...prev,
                selectedSavedBankId: found.id,
                bankCode: found.bankCode,
                bankName: found.bankName,
                accountNumber: found.accountNumber,
                accountHolder: found.accountHolder
            }));
        }
    };

    // Gửi yêu cầu rút tiền
    const handleWithdrawSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(withdrawForm.amount);
        if (isNaN(numAmount) || numAmount < 50000) {
            showToast('Số tiền rút tối thiểu là 50.000 đ', 'error');
            return;
        }
        if (numAmount > balance) {
            showToast('Số dư ví không đủ để rút số tiền này', 'error');
            return;
        }
        if (!withdrawForm.accountNumber.trim() || !withdrawForm.accountHolder.trim()) {
            showToast('Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản', 'error');
            return;
        }

        try {
            setActionLoading(true);
            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: numAmount,
                    bankCode: withdrawForm.bankCode,
                    bankName: withdrawForm.bankName,
                    accountNumber: withdrawForm.accountNumber,
                    accountHolder: withdrawForm.accountHolder,
                    note: withdrawForm.note,
                    saveBank: withdrawForm.saveBank
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Tạo yêu cầu rút tiền thành công!');
                setShowWithdrawModal(false);
                setWithdrawForm(prev => ({ ...prev, amount: '', note: '' }));
                fetchWalletData();
                setSubTab('withdrawals');
            } else {
                showToast(data.message || 'Lỗi khi tạo yêu cầu rút tiền', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Lỗi hệ thống', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Khởi tạo nạp tiền vào ví
    const handleDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(depositForm.amount);
        if (isNaN(numAmount) || numAmount < 10000) {
            showToast('Số tiền nạp tối thiểu là 10.000 đ', 'error');
            return;
        }

        try {
            setActionLoading(true);
            const res = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: numAmount,
                    paymentMethod: depositForm.paymentMethod
                })
            });
            const data = await res.json();
            if (data.success) {
                if (data.url) {
                    window.location.href = data.url;
                } else if (data.qrUrl) {
                    setDepositResult(data);
                }
            } else {
                showToast(data.message || 'Lỗi khi khởi tạo nạp tiền', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Lỗi hệ thống', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Xác nhận đã chuyển khoản nạp ví (VietQR)
    const handleConfirmDeposit = async () => {
        if (!depositResult) return;
        try {
            setActionLoading(true);
            const res = await fetch('/api/wallet/deposit/confirm', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    depositTxId: depositResult.depositTxId,
                    amount: depositResult.amount
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Nạp tiền vào ví thành công!');
                setShowDepositModal(false);
                setDepositResult(null);
                fetchWalletData();
            } else {
                showToast(data.message || 'Lỗi xác nhận nạp tiền', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Lỗi hệ thống', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Thêm tài khoản ngân hàng mới
    const handleAddBankSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankForm.accountNumber.trim() || !bankForm.accountHolder.trim()) {
            showToast('Vui lòng điền đầy đủ thông tin tài khoản', 'error');
            return;
        }

        try {
            setActionLoading(true);
            const res = await fetch('/api/wallet/banks', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bankForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Đã lưu tài khoản ngân hàng thành công!');
                setShowAddBankModal(false);
                setBankForm({
                    bankCode: 'VCB',
                    bankName: 'Vietcombank',
                    accountNumber: '',
                    accountHolder: ''
                });
                fetchWalletData();
            } else {
                showToast(data.message || 'Lỗi khi lưu ngân hàng', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Lỗi hệ thống', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Xóa tài khoản ngân hàng
    const handleDeleteBank = async (bankId: string) => {
        if (!confirm('Bạn có chắc muốn xóa tài khoản ngân hàng này?')) return;
        try {
            const res = await fetch(`/api/wallet/banks/${bankId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                showToast('Đã xóa tài khoản ngân hàng');
                fetchWalletData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast popup */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-2xl text-xs font-bold shadow-lg border flex items-center gap-2 ${
                            toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                    >
                        {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        <span>{toastMsg.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CARD SỐ DƯ VÍ TÀI KHOẢN HAVEN PAY ── */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                            <CreditCard size={16} />
                            <span>Ví tài khoản HAVEN Pay</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                                Khả dụng
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Số dư khả dụng để mua sắm 1 chạm & rút tiền về ngân hàng</p>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight mt-3 text-emerald-400">
                            {loading ? '...' : formatPrice(balance)}
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Nút Rút tiền */}
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                            <ArrowUpRight size={16} className="text-indigo-600" />
                            Rút về Ngân hàng
                        </button>

                        {/* Nút Nạp tiền */}
                        <button
                            onClick={() => { setShowDepositModal(true); setDepositResult(null); }}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                            <ArrowDownLeft size={16} />
                            Nạp thêm tiền
                        </button>

                        {/* Nút Làm mới */}
                        <button
                            onClick={fetchWalletData}
                            disabled={loading}
                            className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                            title="Làm mới số dư"
                        >
                            <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── TABS CHỨC NĂNG BÊN TRONG VÍ ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            onClick={() => setSubTab('history')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                subTab === 'history' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Lịch sử biến động ({transactions.length})
                        </button>
                        <button
                            onClick={() => setSubTab('withdrawals')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                subTab === 'withdrawals' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Lệnh rút tiền ({withdrawals.length})
                        </button>
                        <button
                            onClick={() => setSubTab('banks')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                subTab === 'banks' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Tài khoản ngân hàng ({savedBanks.length})
                        </button>
                    </div>

                    {subTab === 'banks' && (
                        <button
                            onClick={() => setShowAddBankModal(true)}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            <Plus size={14} />
                            Thêm tài khoản ngân hàng
                        </button>
                    )}
                </div>

                {/* 1. LỊCH SỬ BIẾN ĐỘNG SỐ DƯ */}
                {subTab === 'history' && (
                    <div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-12 text-center">
                                <CreditCard className="mx-auto text-slate-200 mb-3" size={40} />
                                <p className="text-slate-500 font-medium text-sm">Chưa có lịch sử giao dịch ví nào</p>
                                <p className="text-slate-400 text-xs mt-1">Khi bạn nạp tiền, rút tiền, hoàn tiền hoặc thanh toán đơn hàng, giao dịch sẽ xuất hiện ở đây.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-4 bg-slate-50/50">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                                                tx.amount > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                                            }`}>
                                                {tx.amount > 0 ? '+' : '-'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{tx.description}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                                                    <span>Mã GD: <strong className="font-mono text-slate-700">{tx.id}</strong></span>
                                                    {tx.orderId && <span>· Đơn: <strong className="font-mono text-slate-700">#{tx.orderId}</strong></span>}
                                                    {tx.withdrawalRequestId && <span>· Lệnh rút: <strong className="font-mono text-indigo-600">#{tx.withdrawalRequestId}</strong></span>}
                                                    <span>· {new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm sm:text-base font-black font-mono ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {tx.amount > 0 ? `+${formatPrice(tx.amount)}` : `${formatPrice(tx.amount)}`}
                                            </p>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                                tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                                {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. LỆNH RÚT TIỀN VỀ NGÂN HÀNG */}
                {subTab === 'withdrawals' && (
                    <div>
                        {withdrawals.length === 0 ? (
                            <div className="p-12 text-center">
                                <ArrowUpRight className="mx-auto text-slate-200 mb-3" size={40} />
                                <p className="text-slate-500 font-medium text-sm">Chưa có yêu cầu rút tiền nào</p>
                                <p className="text-slate-400 text-xs mt-1">Bạn có thể rút tiền từ số dư ví về bất kỳ tài khoản ngân hàng nào tại Việt Nam.</p>
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Tạo yêu cầu rút tiền ngay
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {withdrawals.map((w) => (
                                    <div key={w.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs bg-slate-200/80 px-2 py-0.5 rounded text-slate-800">{w.id}</span>
                                                    <span className="text-xs font-bold text-slate-900 uppercase">{w.bankInfo.bankCode} - {w.bankInfo.bankName}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    STK: <strong className="font-mono text-indigo-600">{w.bankInfo.accountNumber}</strong> · Chủ TK: <strong className="uppercase">{w.bankInfo.accountHolder}</strong>
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Ngày tạo: {new Date(w.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                                {w.adminNote && (
                                                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 inline-block">
                                                        Phản hồi: {w.adminNote}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                            <p className="text-base font-black font-mono text-slate-900">{formatPrice(w.amount)}</p>
                                            <div className="mt-1">
                                                {w.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock size={12} />
                                                        Đang chờ duyệt
                                                    </span>
                                                )}
                                                {w.status === 'completed' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 size={12} />
                                                        Đã chuyển tiền
                                                    </span>
                                                )}
                                                {w.status === 'rejected' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle size={12} />
                                                        Đã từ chối (Đã hoàn tiền vào ví)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TÀI KHOẢN NGÂN HÀNG ĐÃ LƯU */}
                {subTab === 'banks' && (
                    <div>
                        {savedBanks.length === 0 ? (
                            <div className="p-12 text-center">
                                <Building2 className="mx-auto text-slate-200 mb-3" size={40} />
                                <p className="text-slate-500 font-medium text-sm">Bạn chưa lưu tài khoản ngân hàng nào</p>
                                <p className="text-slate-400 text-xs mt-1">Lưu tài khoản ngân hàng giúp bạn rút tiền về tài khoản nhanh chóng chỉ với 1 click.</p>
                                <button
                                    onClick={() => setShowAddBankModal(true)}
                                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    Thêm tài khoản ngân hàng ngay
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {savedBanks.map((b) => (
                                    <div key={b.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-indigo-300 transition-all relative flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-lg uppercase">
                                                    {b.bankCode}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteBank(b.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Xóa tài khoản này"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-900">{b.bankName}</h4>
                                            <p className="font-mono text-base font-bold text-indigo-600 tracking-wider mt-1">{b.accountNumber}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase mt-1">{b.accountHolder}</p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                                <ShieldCheck size={14} /> Sẵn sàng nhận tiền
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setWithdrawForm(prev => ({
                                                        ...prev,
                                                        selectedSavedBankId: b.id,
                                                        bankCode: b.bankCode,
                                                        bankName: b.bankName,
                                                        accountNumber: b.accountNumber,
                                                        accountHolder: b.accountHolder
                                                    }));
                                                    setShowWithdrawModal(true);
                                                }}
                                                className="text-xs font-bold text-slate-800 hover:text-indigo-600 cursor-pointer"
                                            >
                                                Rút về thẻ này →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── MODAL 1: RÚT TIỀN VỀ NGÂN HÀNG ── */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <ArrowUpRight size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Rút Tiền Về Ngân Hàng</h3>
                                    <p className="text-xs text-slate-500">Số dư khả dụng: <strong className="text-emerald-600 font-mono text-sm">{formatPrice(balance)}</strong></p>
                                </div>
                            </div>

                            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                                {/* Chọn tài khoản đã lưu nếu có */}
                                {savedBanks.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Chọn tài khoản ngân hàng đã lưu
                                        </label>
                                        <select
                                            value={withdrawForm.selectedSavedBankId}
                                            onChange={(e) => handleSelectSavedBank(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        >
                                            <option value="">-- Nhập tài khoản ngân hàng khác --</option>
                                            {savedBanks.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.bankCode} - {b.accountNumber} ({b.accountHolder})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Chọn Ngân hàng */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={withdrawForm.bankCode}
                                        onChange={(e) => {
                                            const b = POPULAR_BANKS.find(x => x.code === e.target.value);
                                            setWithdrawForm(prev => ({
                                                ...prev,
                                                bankCode: e.target.value,
                                                bankName: b ? b.shortName : e.target.value
                                            }));
                                        }}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    >
                                        {POPULAR_BANKS.map(b => (
                                            <option key={b.code} value={b.code}>
                                                [{b.code}] {b.shortName} - {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Số tài khoản & Tên chủ thẻ */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Số tài khoản <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={withdrawForm.accountNumber}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                            placeholder="Ví dụ: 0123456789"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Tên chủ tài khoản <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={withdrawForm.accountHolder}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                                            placeholder="NGUYEN VAN A"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </div>
                                </div>

                                {/* Số tiền rút */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Số tiền muốn rút (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            min={50000}
                                            max={balance}
                                            value={withdrawForm.amount}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                                            placeholder="Tối thiểu 50.000 đ"
                                            className="w-full p-3 pr-16 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
                                    </div>

                                    {/* Phím chọn nhanh */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {[100000, 200000, 500000].map(amt => (
                                            <button
                                                type="button"
                                                key={amt}
                                                disabled={amt > balance}
                                                onClick={() => setWithdrawForm(prev => ({ ...prev, amount: String(amt) }))}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                                            >
                                                {formatPrice(amt)}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={balance < 50000}
                                            onClick={() => setWithdrawForm(prev => ({ ...prev, amount: String(balance) }))}
                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                                        >
                                            Toàn bộ ({formatPrice(balance)})
                                        </button>
                                    </div>
                                </div>

                                {/* Checkbox lưu tài khoản */}
                                {!withdrawForm.selectedSavedBankId && (
                                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                                        <input
                                            type="checkbox"
                                            checked={withdrawForm.saveBank}
                                            onChange={(e) => setWithdrawForm(prev => ({ ...prev, saveBank: e.target.checked }))}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Lưu thông tin ngân hàng này cho các lần rút sau</span>
                                    </label>
                                )}

                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                                    <p>• Phí rút tiền: <strong className="text-emerald-600">0 VNĐ (Miễn phí)</strong></p>
                                    <p>• Thời gian xử lý: <strong className="text-slate-700">15 - 30 phút</strong> làm việc</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowWithdrawModal(false)}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || balance < 50000}
                                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Đang gửi yêu cầu...' : 'Xác nhận Rút tiền'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL 2: NẠP TIỀN VÀO VÍ HAVEN ── */}
            <AnimatePresence>
                {showDepositModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
                        >
                            <button
                                onClick={() => { setShowDepositModal(false); setDepositResult(null); }}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <ArrowDownLeft size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Nạp Tiền Vào Ví HAVEN</h3>
                                    <p className="text-xs text-slate-500">Nạp tiền để mua sắm & nhận ưu đãi độc quyền</p>
                                </div>
                            </div>

                            {!depositResult ? (
                                <form onSubmit={handleDepositSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Số tiền muốn nạp (VNĐ)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                required
                                                min={10000}
                                                step={10000}
                                                value={depositForm.amount}
                                                onChange={(e) => setDepositForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                                                className="w-full p-3 pr-16 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-black text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
                                        </div>

                                        {/* Phím chọn nhanh */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {[50000, 100000, 200000, 500000, 1000000].map(amt => (
                                                <button
                                                    type="button"
                                                    key={amt}
                                                    onClick={() => setDepositForm(prev => ({ ...prev, amount: amt }))}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                                        depositForm.amount === amt ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    {formatPrice(amt)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-2">
                                            Chọn phương thức thanh toán
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'vietqr', label: 'Chuyển khoản Ngân hàng (Quét VietQR 247)', icon: QrCode, tag: 'Nhanh nhất' },
                                                { id: 'vnpay', label: 'Cổng thanh toán VNPay', icon: CreditCard },
                                                { id: 'momo', label: 'Ví điện tử MoMo', icon: DollarSign }
                                            ].map(pm => (
                                                <label
                                                    key={pm.id}
                                                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                                                        depositForm.paymentMethod === pm.id
                                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name="depositMethod"
                                                            checked={depositForm.paymentMethod === pm.id}
                                                            onChange={() => setDepositForm(prev => ({ ...prev, paymentMethod: pm.id as any }))}
                                                            className="w-4 h-4 text-indigo-600"
                                                        />
                                                        <span className="text-xs font-bold text-slate-800">{pm.label}</span>
                                                    </div>
                                                    {pm.tag && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                                            {pm.tag}
                                                        </span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowDepositModal(false)}
                                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Đóng
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                        >
                                            Tiếp tục
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* VietQR Screen */
                                <div className="text-center space-y-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="relative w-56 h-56 mx-auto rounded-xl overflow-hidden bg-white p-2 shadow-inner">
                                            <img
                                                src={depositResult.qrUrl}
                                                alt="VietQR Deposit"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="mt-3 text-left text-xs space-y-1 text-slate-700">
                                            <p>Ngân hàng: <strong>{depositResult.bankInfo.bankName}</strong></p>
                                            <p>Số tài khoản: <strong className="font-mono text-indigo-600 font-bold">{depositResult.bankInfo.accountNumber}</strong></p>
                                            <p>Chủ tài khoản: <strong>{depositResult.bankInfo.accountHolder}</strong></p>
                                            <p>Số tiền: <strong className="text-emerald-600 font-mono font-bold text-sm">{formatPrice(depositResult.amount)}</strong></p>
                                            <p>Nội dung CK: <strong className="font-mono text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded">{depositResult.depositTxId}</strong></p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDepositResult(null)}
                                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            onClick={handleConfirmDeposit}
                                            disabled={actionLoading}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                        >
                                            <Check size={16} />
                                            Tôi đã chuyển tiền
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL 3: THÊM TÀI KHOẢN NGÂN HÀNG ── */}
            <AnimatePresence>
                {showAddBankModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
                        >
                            <button
                                onClick={() => setShowAddBankModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Thêm Tài Khoản Ngân Hàng</h3>
                                    <p className="text-xs text-slate-500">Lưu tài khoản để nhận tiền rút từ ví nhanh chóng</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddBankSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Ngân hàng <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={bankForm.bankCode}
                                        onChange={(e) => {
                                            const b = POPULAR_BANKS.find(x => x.code === e.target.value);
                                            setBankForm(prev => ({
                                                ...prev,
                                                bankCode: e.target.value,
                                                bankName: b ? b.shortName : e.target.value
                                            }));
                                        }}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    >
                                        {POPULAR_BANKS.map(b => (
                                            <option key={b.code} value={b.code}>
                                                [{b.code}] {b.shortName} - {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Số tài khoản <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={bankForm.accountNumber}
                                        onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                        placeholder="Nhập số tài khoản ngân hàng"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tên chủ tài khoản <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={bankForm.accountHolder}
                                        onChange={(e) => setBankForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                                        placeholder="NGUYEN VAN A (Viết hoa không dấu)"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>

                                <div className="flex gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddBankModal(false)}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                                    >
                                        Lưu tài khoản
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
