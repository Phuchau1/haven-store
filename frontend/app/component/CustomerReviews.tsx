'use client';
// ===== CUSTOMER REVIEWS SECTION =====
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Review {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    avatar: string;
}

const DEFAULT_REVIEWS: Review[] = [
    {
        id: 'rev-1',
        name: 'Trần Minh Hoàng',
        role: 'Khách hàng thân thiết',
        content: 'Chất lượng áo polo và sơ mi của HAVEN cực kỳ ấn tượng. Form dáng chuẩn, chất vải mát và đường may rất tinh tế.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'
    },
    {
        id: 'rev-2',
        name: 'Nguyễn Thu Trang',
        role: 'Khách hàng VIP',
        content: 'Đồ nữ công sở rất thanh lịch, đóng gói chỉn chu và giao hàng cực nhanh. Chắc chắn sẽ tiếp tục ủng hộ HAVEN.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop'
    },
    {
        id: 'rev-3',
        name: 'Lê Tuấn Kiệt',
        role: 'Khách hàng thân thiết',
        content: 'Quần âu và blazer mặc lên rất đứng form. Dịch vụ chăm sóc khách hàng và tư vấn size rất chu đáo và nhiệt tình.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop'
    }
];

export default function CustomerReviews() {
    const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.settings && Array.isArray(data.settings.homepageReviews) && data.settings.homepageReviews.length > 0) {
                    setReviews(data.settings.homepageReviews);
                }
            } catch (error) {
                console.error('Lỗi khi tải đánh giá trang chủ:', error);
            }
        };

        fetchReviews();
    }, []);

    if (reviews.length === 0) return null;

    return (
        <section className="py-20 bg-black overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl opacity-10"></div>
                <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-white blur-3xl opacity-5"></div>
            </div>

            <div className="container-torano relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase text-white tracking-tight mb-4">
                            Khách hàng nói gì?
                        </h2>
                        <p className="text-gray-400 font-medium max-w-2xl mx-auto">
                            Hơn 10.000+ khách hàng đã tin tưởng và trải nghiệm sản phẩm tại PH Store.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {reviews.map((review, index) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            className="bg-[#111] border border-gray-800 rounded-3xl p-8 relative group hover:border-gray-600 transition-colors"
                        >
                            <Quote className="absolute top-6 right-6 text-gray-800 w-12 h-12 rotate-180 group-hover:text-gray-700 transition-colors" />
                            
                            <div className="flex gap-1 mb-6">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            
                            <p className="text-gray-300 leading-relaxed mb-8 relative z-10 text-sm md:text-base">
                                &quot;{review.content}&quot;
                            </p>
                            
                            <div className="flex items-center gap-4 border-t border-gray-800 pt-6 mt-auto">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800">
                                    {review.avatar ? (
                                        <Image 
                                            src={review.avatar} 
                                            alt={review.name} 
                                            width={48} 
                                            height={48} 
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                            {review.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{review.name}</h4>
                                    <p className="text-gray-500 text-xs mt-0.5">{review.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
