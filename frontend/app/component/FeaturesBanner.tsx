'use client';
// ===== BST XUÂN HÈ 2026: EASY DAILY SECTION =====
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FeaturesBanner() {
    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-white border-y border-slate-100 overflow-hidden">
            <div className="container-torano">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center">
                    {/* ── Left: Collection Banner Image ─────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 relative group"
                    >
                        <Link href="/products" className="block relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all duration-500">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/bst-xuan-he-2026.png"
                                alt="BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG"
                                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                        </Link>
                    </motion.div>

                    {/* ── Right: Collection Description & Action ───────── */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 flex flex-col justify-center"
                    >
                        <h2 className="text-2xl sm:text-3xl lg:text-[32px] xl:text-[36px] font-black text-slate-900 leading-[1.25] tracking-tight uppercase">
                            BST XUÂN HÈ 2026: EASY DAILY | BẮT NHỊP SỐNG - HÒA NHỊP SỐNG
                        </h2>

                        <div className="mt-5 sm:mt-6 space-y-4 text-slate-600 text-[14px] sm:text-[15px] leading-relaxed font-normal">
                            <p>
                                ✨ <strong className="font-semibold text-slate-800">BST Xuân Hè</strong> cập bến mang theo tinh thần <strong className="font-semibold text-slate-900">&quot;Easy&quot;</strong> thoải mái trải nghiệm cùng những trang phục <strong className="font-semibold text-slate-900">&quot;Daily&quot;</strong> tiện dụng mỗi ngày. HAVEN tin rằng, khi trang phục đủ nhẹ tênh, tâm trí sẽ tự khắc rộng mở để bạn bắt trọn nhịp điệu cuộc sống. Sẵn sàng cho một diện mạo rạng rỡ và trải nghiệm đầy năng lượng cùng HAVEN ngay hôm nay!
                            </p>
                        </div>

                        <div className="mt-6 sm:mt-8">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 hover:text-[#C9A227] underline underline-offset-8 decoration-2 hover:decoration-[#C9A227] transition-all group cursor-pointer"
                            >
                                <span>Xem chi tiết</span>
                                <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
