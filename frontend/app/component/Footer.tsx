'use client';
// ===== FOOTER COMPONENT =====
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Facebook, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#111111] border-t border-[#222222]">
            <div className="container-torano py-20 lg:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
                    {/* Brand Info */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="inline-block bg-white p-2 rounded-xl hover:bg-gray-50 transition-colors mb-4">
                            <img src="/logo-new.png" alt="HAVEN STORE" className="h-[40px] w-auto object-contain drop-shadow-sm" />
                        </Link>
                        <p className="mt-6 text-sm text-[#BDBDBD] leading-relaxed font-normal" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
                            Thương hiệu thời trang hàng đầu Việt Nam. Chúng tôi mang đến những sản phẩm
                            chất lượng cao với giá cả hợp lý nhất.
                        </p>
                        {/* Social */}
                        <div className="flex items-center gap-3 mt-6">
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-full bg-[#222222] flex items-center justify-center text-[#BDBDBD] hover:bg-[#C9A227] hover:text-[#111111] transition-all duration-300"
                                aria-label="Instagram"
                            >
                                <Instagram size={15} />
                            </motion.a>
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-full bg-[#222222] flex items-center justify-center text-[#BDBDBD] hover:bg-[#C9A227] hover:text-[#111111] transition-all duration-300"
                                aria-label="Facebook"
                            >
                                <Facebook size={15} />
                            </motion.a>
                            {/* TikTok */}
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-full bg-[#222222] flex items-center justify-center text-[#BDBDBD] hover:bg-[#C9A227] hover:text-[#111111] transition-all duration-300"
                                aria-label="TikTok"
                            >
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11V9a6.33 6.33 0 00-5.7 6.33A6.33 6.33 0 0010.95 22a6.34 6.34 0 006.33-6.33V9.3a8.16 8.16 0 004.74 1.52V7.37a4.85 4.85 0 01-2.43-.68z" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Liên kết nhanh</h3>
                        <ul className="space-y-3">
                            {[
                                { href: '/products', label: 'Tất cả sản phẩm' },
                                { href: '/products?category=quan-ao', label: 'Quần áo' },
                                { href: '/products?category=giay', label: 'Giày dép' },
                                { href: '/products?category=phu-kien', label: 'Phụ kiện' },
                                { href: '/about', label: 'Về chúng tôi' },
                                { href: '/contact', label: 'Liên hệ' },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[#BDBDBD] hover:text-[#C9A227] transition-colors font-normal"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Chính sách</h3>
                        <ul className="space-y-3">
                            {[
                                'Chính sách đổi trả',
                                'Chính sách bảo mật',
                                'Điều khoản sử dụng',
                                'Hướng dẫn mua hàng',
                                'Câu hỏi thường gặp',
                            ].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-sm text-[#BDBDBD] hover:text-[#C9A227] transition-colors font-normal">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-4">Liên hệ</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MapPin size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-[#BDBDBD] font-normal">123 Nguyễn Huệ, Quận 1, TP. HCM</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={15} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-[#BDBDBD] font-normal">1900 8888</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={15} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-[#BDBDBD] font-normal">support@phstore.vn</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Clock size={15} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-[#BDBDBD] font-normal">8:00 - 22:00 hàng ngày</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#222222] py-6">
                <div className="container-torano flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400 font-light">
                        © 2026 HAVEN STORE. All rights reserved. Designed by Hậu.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400 font-light">Chấp nhận:</span>
                        <div className="flex items-center gap-2">
                            {['VISA', 'MC', 'MOMO', 'COD'].map((method) => (
                                <span key={method} className="px-2 py-1 bg-[#222222] text-[10px] font-medium text-[#BDBDBD] rounded">
                                    {method}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
