import React from 'react';
import Image from 'next/image';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gray-50 py-16 lg:py-24">
                <div className="container-torano text-center">
                    <h1 className="text-4xl lg:text-5xl font-light text-black tracking-tight mb-4">Về PH Store</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
                        Chúng tôi tự hào mang đến những sản phẩm thời trang cao cấp, tối giản và tinh tế, giúp bạn tự tin thể hiện phong cách cá nhân.
                    </p>
                </div>
            </div>
            
            <div className="container-torano py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                        <Image 
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1000&fit=crop" 
                            alt="Về PH Store" 
                            fill 
                            className="object-cover"
                        />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-light tracking-tight">Câu chuyện của chúng tôi</h2>
                        <p className="text-gray-600 font-light leading-relaxed">
                            Được thành lập với một tầm nhìn đơn giản: tạo ra những bộ trang phục không chỉ đẹp mắt mà còn mang lại cảm giác thoải mái tuyệt đối cho người mặc. Chúng tôi tin rằng thời trang là ngôn ngữ không lời, là cách bạn nói với thế giới bạn là ai.
                        </p>
                        <p className="text-gray-600 font-light leading-relaxed">
                            Từ việc lựa chọn những chất liệu vải tốt nhất đến việc chăm chút từng đường kim mũi chỉ, mỗi sản phẩm tại PH Store đều là kết quả của sự tận tâm và niềm đam mê mãnh liệt với thời trang.
                        </p>
                        <div className="pt-6 grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-3xl font-bold text-black mb-2">10k+</h3>
                                <p className="text-sm text-gray-500 font-light uppercase tracking-wider">Khách hàng tin dùng</p>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-black mb-2">5+</h3>
                                <p className="text-sm text-gray-500 font-light uppercase tracking-wider">Cửa hàng toàn quốc</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
