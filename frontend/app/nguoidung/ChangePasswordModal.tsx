'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, KeyRound, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
}

export default function ChangePasswordModal({ isOpen, onClose, email }: ChangePasswordModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Reset state when opening/closing
    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setNewPassword('');
            setConfirmPassword('');
            setOtp('');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (data.success) {
                setStep(2);
                setSuccessMessage('Mã xác nhận đã được gửi đến email của bạn!');
            } else {
                setError(data.message || 'Lỗi gửi mã OTP.');
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!otp.trim()) {
            setError('Vui lòng nhập mã OTP.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, password: newPassword })
            });
            const data = await res.json();
            
            if (data.success) {
                setSuccessMessage('Đổi mật khẩu thành công!');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(data.message || 'Mã OTP không đúng hoặc đã hết hạn.');
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
                >
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-900">
                            {step === 1 ? 'Đổi mật khẩu' : 'Xác thực OTP'}
                        </h3>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {successMessage && step === 2 && !error && (
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-start gap-2">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleRequestOtp} className="space-y-4">
                                <p className="text-sm text-slate-500 mb-4">
                                    Vui lòng nhập mật khẩu mới. Một mã OTP sẽ được gửi về email <span className="font-bold text-slate-800">{email}</span> để xác nhận.
                                </p>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required 
                                            type="password" 
                                            value={newPassword} 
                                            onChange={e => setNewPassword(e.target.value)} 
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            placeholder="Nhập mật khẩu mới..." 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhập lại mật khẩu mới</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)} 
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            placeholder="Xác nhận mật khẩu..." 
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Gửi mã OTP
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyAndChange} className="space-y-4">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                        <KeyRound size={28} />
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Nhập mã OTP 6 số vừa được gửi đến email<br/>
                                        <span className="font-bold text-slate-800">{email}</span>
                                    </p>
                                </div>

                                <div className="space-y-1.5 max-w-xs mx-auto">
                                    <input 
                                        required 
                                        type="text" 
                                        maxLength={6}
                                        value={otp} 
                                        onChange={e => setOtp(e.target.value)} 
                                        className="w-full text-center tracking-[0.5em] font-bold text-2xl py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all uppercase" 
                                        placeholder="------" 
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                    Xác nhận & Đổi mật khẩu
                                </button>

                                <div className="text-center mt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)} 
                                        className="text-xs text-slate-500 hover:text-indigo-600 font-medium"
                                    >
                                        Quay lại
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
