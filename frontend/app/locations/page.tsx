import React from 'react';

export default function LocationsPage() {
    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50">
            <div className="container-torano">
                <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Hệ Thống Cửa Hàng</h1>
                    <p className="text-gray-600 text-center mb-12">Khám phá các cửa hàng HAVEN STORE trên toàn quốc. Trải nghiệm không gian mua sắm hiện đại và đẳng cấp.</p>

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
                                <h3 className="text-xl font-bold mb-2">HAVEN STORE - Tây Ninh</h3>
                                <p className="text-gray-600 mb-1"><strong>Địa chỉ:</strong> Đường 30/4, Phường 3, Thành phố Tây Ninh, Tây Ninh</p>
                                <p className="text-gray-600 mb-1"><strong>Điện thoại:</strong> 0276 1234 567</p>
                                <p className="text-gray-600 mb-4"><strong>Giờ mở cửa:</strong> 09:00 - 22:00 (Tất cả các ngày trong tuần)</p>
                                <div className="mt-4 w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        frameBorder="0" 
                                        scrolling="no" 
                                        marginHeight={0} 
                                        marginWidth={0} 
                                        src="https://maps.google.com/maps?q=Th%C3%A0nh%20ph%E1%BB%91%20T%C3%A2y%20Ninh,%20T%C3%A2y%20Ninh,%20Vi%E1%BB%87t%20Nam&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                        title="Bản đồ Tây Ninh"
                                    ></iframe>
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
                                <h3 className="text-xl font-bold mb-2">HAVEN STORE - TP. Hồ Chí Minh</h3>
                                <p className="text-gray-600 mb-1"><strong>Địa chỉ:</strong> 456 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</p>
                                <p className="text-gray-600 mb-1"><strong>Điện thoại:</strong> 028 8765 4321</p>
                                <p className="text-gray-600 mb-4"><strong>Giờ mở cửa:</strong> 09:00 - 22:30 (Tất cả các ngày trong tuần)</p>
                                <div className="mt-4 w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        frameBorder="0" 
                                        scrolling="no" 
                                        marginHeight={0} 
                                        marginWidth={0} 
                                        src="https://maps.google.com/maps?q=456%20Nguy%E1%BB%85n%20Tr%C3%A3i,%20Qu%E1%BA%ADn%201,%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                        title="Bản đồ TP. Hồ Chí Minh"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
