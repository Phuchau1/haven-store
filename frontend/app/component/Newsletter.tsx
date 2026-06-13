'use client';
// ===== NEWSLETTER SECTION =====
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Check } from 'lucide-react';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setIsSubscribed(true);
            setTimeout(() => {
                setIsSubscribed(false);
                setEmail('');
            }, 3000);
        }
    };

    return (
        <section className="py-20 lg:py-28 bg-black text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-xs tracking-[4px] uppercase text-gray-400 font-light">
                        Đăng ký nhận tin
                    </span>
                    <h2 className="mt-4 text-3xl lg:text-5xl font-bold tracking-tight">
                        Không bỏ lỡ ưu đãi
                    </h2>
                    <p className="mt-6 text-gray-300 font-normal text-sm max-w-md mx-auto">
                        Đăng ký để nhận thông tin về sản phẩm mới, khuyến mãi độc quyền
                        và giảm ngay 10% cho đơn hàng đầu tiên.
                    </p>
                </motion.div>

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-10 flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn..."
                        className="w-full px-6 py-4 bg-white border border-gray-200 rounded-full text-sm text-black placeholder-gray-500 focus:outline-none focus:border-black transition-all font-medium shadow-sm"
                        required
                    />
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-3 px-10 py-4 rounded-full text-[11px] font-bold tracking-[2px] uppercase whitespace-nowrap transition-all ${isSubscribed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                            }`}
                    >
                        {isSubscribed ? (
                            <>
                                <Check size={16} />
                                Đã đăng ký
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Đăng ký ngay
                            </>
                        )}
                    </motion.button>
                </motion.form>
            </div>
        </section>
    );
}
