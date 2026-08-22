'use client';
// ===== FOOTER COMPONENT =====
import React from 'react';
import Link from 'next/link';
// Image unused
import { motion } from 'framer-motion';
import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 text-slate-900">
            <div className="container-torano py-16 lg:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 w-full">
                    {/* Col 1: Brand Info (4/12) */}
                    <div className="lg:col-span-4">
                        <Link href="/" className="inline-block mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo-new.png" alt="HAVEN" className="h-[56px] w-auto object-contain drop-shadow-xs" />
                        </Link>
                        <p className="text-sm text-slate-600 leading-relaxed font-normal max-w-sm">
                            Thương hiệu thời trang hàng đầu Việt Nam. Chúng tôi mang đến những sản phẩm
                            chất lượng cao với giá cả hợp lý nhất.
                        </p>
                        {/* Social */}
                        <div className="flex items-center gap-3 mt-6">
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-950 hover:text-white transition-all duration-300 shadow-2xs"
                                aria-label="Instagram"
                            >
                                <Instagram size={16} />
                            </motion.a>
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-950 hover:text-white transition-all duration-300 shadow-2xs"
                                aria-label="Facebook"
                            >
                                <Facebook size={16} />
                            </motion.a>
                            {/* TikTok */}
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-950 hover:text-white transition-all duration-300 shadow-2xs"
                                aria-label="TikTok"
                            >
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11V9a6.33 6.33 0 00-5.7 6.33A6.33 6.33 0 0010.95 22a6.34 6.34 0 006.33-6.33V9.3a8.16 8.16 0 004.74 1.52V7.37a4.85 4.85 0 01-2.43-.68z" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>

                    {/* Col 2: Quick Links (3/12) */}
                    <div className="lg:col-span-3">
                        <h3 className="text-[13px] font-black text-slate-950 tracking-wider uppercase mb-4 whitespace-nowrap">
                            LIÊN KẾT NHANH
                        </h3>
                        <ul className="space-y-2.5">
                            {[
                                { href: '/products', label: 'Tất cả sản phẩm' },
                                { href: '/collections/nam', label: 'Thời trang Nam' },
                                { href: '/collections/do-nu', label: 'Thời trang Nữ' },
                                { href: '/collections/sale', label: 'Khuyến mãi & Sale' },
                                { href: '/about', label: 'Về chúng tôi' },
                                { href: '/contact', label: 'Liên hệ' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="group inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950 font-medium transition-colors whitespace-nowrap"
                                    >
                                        <span className="text-slate-400 group-hover:text-slate-950 text-xs transition-colors">›</span>
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3: Policies (2.5 -> 2/12) */}
                    <div className="lg:col-span-3">
                        <h3 className="text-[13px] font-black text-slate-950 tracking-wider uppercase mb-4 whitespace-nowrap">
                            CHÍNH SÁCH
                        </h3>
                        <ul className="space-y-2.5">
                            {[
                                { href: '/about/chinh-sach-doi-tra', label: 'Chính sách đổi trả' },
                                { href: '/about/chinh-sach-bao-mat', label: 'Chính sách bảo mật' },
                                { href: '/about/dieu-khoan-su-dung', label: 'Điều khoản sử dụng' },
                                { href: '/about/huong-dan-mua-hang', label: 'Hướng dẫn mua hàng' },
                                { href: '/about/cau-hoi-thuong-gap', label: 'Câu hỏi thường gặp' },
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link 
                                        href={item.href} 
                                        className="group inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950 font-medium transition-colors whitespace-nowrap"
                                    >
                                        <span className="text-slate-400 group-hover:text-slate-950 text-xs transition-colors">›</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 4: Contact Info (3/12) */}
                    <div className="lg:col-span-3">
                        <h3 className="text-[13px] font-black text-slate-950 tracking-wider uppercase mb-4 whitespace-nowrap">
                            LIÊN HỆ
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MapPin size={16} className="text-slate-500 mt-0.5 shrink-0" />
                                <span className="text-sm text-slate-600 font-medium leading-tight">
                                    123 Nguyễn Huệ, Quận 1, TP. HCM
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={16} className="text-slate-500 shrink-0" />
                                <a href="tel:19008888" className="text-sm text-slate-600 hover:text-slate-950 font-medium transition-colors">
                                    1900 8888
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={16} className="text-slate-500 shrink-0" />
                                <a href="mailto:support@havenstore.vn" className="text-sm text-slate-600 hover:text-slate-950 font-medium transition-colors">
                                    support@havenstore.vn
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Clock size={16} className="text-slate-500 shrink-0" />
                                <span className="text-sm text-slate-600 font-medium">
                                    8:00 - 22:00 hàng ngày
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-150 py-5 bg-slate-50/60">
                <div className="container-torano flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 font-medium">
                        © 2026 HAVEN STORE. All rights reserved. Designed by Hậu.
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium">Chấp nhận:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-[#1a1f71] font-black text-[11px] rounded shadow-2xs">
                                VISA
                            </span>
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-[#eb001b] font-black text-[11px] rounded shadow-2xs">
                                <span className="text-[#eb001b]">●</span><span className="text-[#f79e1b]">●</span>
                            </span>
                            <span className="px-2.5 py-1 bg-[#a50064] text-white font-bold text-[10px] rounded shadow-2xs">
                                momo
                            </span>
                            <span className="px-2.5 py-1 bg-[#008fe5] text-white font-bold text-[10px] rounded shadow-2xs">
                                ZaloPay
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
