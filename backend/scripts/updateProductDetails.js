require('dotenv').config();
const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fashion_store';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB:', MONGODB_URI);
        
        const products = await ProductModel.find();
        console.log(`Found ${products.length} products to update`);

        const getImagesForCategory = (category) => {
            if (category === 'quan-ao') {
                return [
                    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop"
                ];
            } else if (category === 'giay') {
                return [
                    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=750&fit=crop"
                ];
            } else {
                return [
                    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=750&fit=crop",
                    "https://images.unsplash.com/photo-1511499767390-903390e6fbc4?w=600&h=750&fit=crop"
                ];
            }
        };

        const getDetailedContent = (product) => {
            return `
                <div class="space-y-8 text-gray-600 font-light leading-relaxed">
                    <div>
                        <h3 class="text-xl font-medium text-black mb-3 uppercase tracking-wide">Đặc điểm nổi bật</h3>
                        <p>${product.description} Sản phẩm được thiết kế với sự tỉ mỉ trong từng đường kim mũi chỉ, mang lại sự sang trọng và thoải mái tuyệt đối cho người sử dụng. Chất liệu cao cấp được tuyển chọn kỹ lưỡng, đảm bảo độ bền và giữ form cực tốt qua thời gian dài sử dụng.</p>
                        <p class="mt-4">PH Store luôn tự hào khi mang đến những sản phẩm không chỉ đẹp về mặt thẩm mỹ mà còn ứng dụng cao trong đời sống hàng ngày. Bạn hoàn toàn có thể kết hợp sản phẩm này với nhiều trang phục khác nhau để tạo ra những outfit mang đậm cá tính riêng.</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                        <div>
                            <h3 class="text-lg font-medium text-black mb-3">Chất liệu & Bảo quản</h3>
                            <ul class="list-disc pl-5 space-y-2">
                                <li>Chất liệu: Premium nhập khẩu siêu cấp, bề mặt mềm mịn.</li>
                                <li>Độ bền: Chống nhăn, chống bai dão hiệu quả.</li>
                                <li>Khuyến nghị giặt máy ở chế độ nhẹ nhàng, nhiệt độ nước không quá 30°C.</li>
                                <li>Không sử dụng chất tẩy rửa mạnh để bảo vệ màu sắc.</li>
                                <li>Phơi ở nơi thoáng mát, tránh ánh nắng gắt trực tiếp.</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="text-lg font-medium text-black mb-3">Tư vấn kích thước</h3>
                            <p class="mb-3">Sản phẩm có form dáng chuẩn, được tinh chỉnh hoàn hảo để phù hợp với vóc dáng người Châu Á.</p>
                            <p>Nếu bạn phân vân giữa 2 size, PH Store khuyến khích bạn nên chọn size lớn hơn để có sự thoải mái tối đa, hoặc nhắn tin ngay cho đội ngũ CSKH để được tư vấn chính xác nhất theo số đo của bạn.</p>
                        </div>
                    </div>
                </div>
            `;
        };

        let updatedCount = 0;
        for (let product of products) {
            let modified = false;
            
            // Luôn đảm bảo có ít nhất 4 hình ảnh
            if (product.images.length < 4) {
                const originalImages = [...product.images];
                const categoryImages = getImagesForCategory(product.category);
                
                // Trộn ảnh hiện tại với ảnh mẫu để đủ 4-5 ảnh
                const combined = [...originalImages];
                for (let img of categoryImages) {
                    if (!combined.includes(img) && combined.length < 5) {
                        combined.push(img);
                    }
                }
                product.images = combined;
                modified = true;
            }
            
            // Cập nhật nội dung chi tiết nếu chưa có hoặc cập nhật mới
            product.content = getDetailedContent(product);
            modified = true;
            
            if (modified) {
                await product.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} products with multiple images and detailed content.`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to MongoDB or updating products:', err);
        process.exit(1);
    });
