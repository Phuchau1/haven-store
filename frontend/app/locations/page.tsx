import React from 'react';

export default function LocationsPage() {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50">
            <div className="container-torano">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 font-serif">Hệ Thống Cửa Hàng</h1>
                    <p className="text-gray-600 text-center mb-12">Khám phá các cửa hàng PH Store trên toàn quốc. Trải nghiệm không gian mua sắm hiện đại và đẳng cấp.</p>

                    <div className="space-y-8">
                        {/* Store 1 */}
                        <div className="flex flex-col md:flex-row gap-6 border-b border-gray-100 pb-8">
                            <div className="w-full md:w-1/3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop" 
                                    alt="Cửa hàng Hà Nội" 
                                    className="w-full h-48 object-cover rounded-xl"
                                />
                            </div>
                            <div className="w-full md:w-2/3 flex flex-col justify-center">
                                <h3 className="text-xl font-bold mb-2">PH Store - Hà Nội</h3>
                                <p className="text-gray-600 mb-1"><strong>Địa chỉ:</strong> 123 Phố Huế, Quận Hai Bà Trưng, Hà Nội</p>
                                <p className="text-gray-600 mb-1"><strong>Điện thoại:</strong> 024 1234 5678</p>
                                <p className="text-gray-600 mb-4"><strong>Giờ mở cửa:</strong> 09:00 - 22:00 (Tất cả các ngày trong tuần)</p>
                                <div>
                                    <button className="px-5 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
                                        Xem bản đồ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Store 2 */}
                        <div className="flex flex-col md:flex-row gap-6 pb-4">
                            <div className="w-full md:w-1/3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&h=600&fit=crop" 
                                    alt="Cửa hàng TP.HCM" 
                                    className="w-full h-48 object-cover rounded-xl"
                                />
                            </div>
                            <div className="w-full md:w-2/3 flex flex-col justify-center">
                                <h3 className="text-xl font-bold mb-2">PH Store - TP. Hồ Chí Minh</h3>
                                <p className="text-gray-600 mb-1"><strong>Địa chỉ:</strong> 456 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</p>
                                <p className="text-gray-600 mb-1"><strong>Điện thoại:</strong> 028 8765 4321</p>
                                <p className="text-gray-600 mb-4"><strong>Giờ mở cửa:</strong> 09:00 - 22:30 (Tất cả các ngày trong tuần)</p>
                                <div>
                                    <button className="px-5 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors">
                                        Xem bản đồ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
