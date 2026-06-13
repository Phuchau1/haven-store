import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gray-50 py-16 lg:py-24">
                <div className="container-torano text-center">
                    <h1 className="text-4xl lg:text-5xl font-light text-black tracking-tight mb-4">Liên hệ với chúng tôi</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                        Bạn có câu hỏi hoặc cần hỗ trợ? Đừng ngần ngại liên hệ với PH Store. Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.
                    </p>
                </div>
            </div>

            <div className="container-torano py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-light tracking-tight mb-6">Thông tin liên hệ</h2>
                        
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <MapPin className="text-black" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-black mb-1">Địa chỉ cửa hàng</h3>
                                <p className="text-gray-500 font-light">123 Nguyễn Huệ, Quận 1<br/>Thành phố Hồ Chí Minh, Việt Nam</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Phone className="text-black" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-black mb-1">Số điện thoại</h3>
                                <p className="text-gray-500 font-light">1900 8888</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Mail className="text-black" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-black mb-1">Email hỗ trợ</h3>
                                <p className="text-gray-500 font-light">support@phstore.vn</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                                <Clock className="text-black" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-black mb-1">Giờ mở cửa</h3>
                                <p className="text-gray-500 font-light">Thứ 2 - Chủ Nhật: 8:00 - 22:00</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-light tracking-tight mb-6">Gửi tin nhắn</h2>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" placeholder="email@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề</label>
                                <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" placeholder="Chủ đề tin nhắn" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                                <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none" placeholder="Nhập nội dung tin nhắn của bạn..."></textarea>
                            </div>
                            <button type="button" className="w-full py-4 bg-black text-white rounded-xl font-medium tracking-wide hover:bg-gray-900 transition-colors">
                                Gửi Tin Nhắn
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
