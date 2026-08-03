const mongoose = require('mongoose');
const { ProductModel } = require('../src/models/Product');
let FlashSaleModel;
try {
    FlashSaleModel = require('../src/models/FlashSale').FlashSaleModel;
} catch (e) {
    // maybe it exports differently
    FlashSaleModel = require('../src/models/FlashSale');
}
const { ProductVariantModel } = require('../src/models/ProductVariant');

mongoose.connect('mongodb+srv://ntphau21_db_user:l4AQJN8xt0oPC8GD@cluster0.kyrsbnq.mongodb.net/fashion_store').then(async () => {
    try {
        console.log('--- ĐANG CHẠY GIAI ĐOẠN 2: CHUẨN HÓA DỮ LIỆU ---');
        
        // 1. Cập nhật Mô tả SEO cho các sản phẩm chưa có
        const products = await ProductModel.find({});
        let updatedCount = 0;
        for(let p of products) {
            let changed = false;
            if(!p.shortDescription || p.shortDescription === '') {
                p.shortDescription = `Sản phẩm ${p.name} chính hãng từ HAVEN STORE. Chế tác tinh xảo, chất liệu cao cấp mang lại sự thoải mái tuyệt đối. Phù hợp cho mọi dịp, tôn lên vẻ đẹp thanh lịch của bạn.`;
                changed = true;
            }
            if(!p.richContent || p.richContent === '') {
                p.richContent = `
                    <h3>Đặc điểm nổi bật</h3>
                    <ul>
                        <li>Chất liệu: Premium co giãn 4 chiều, thoáng mát</li>
                        <li>Thiết kế: Form dáng hiện đại, đường may tỉ mỉ</li>
                        <li>Độ bền: Không nhăn, không xù lông sau nhiều lần giặt</li>
                    </ul>
                    <p>HAVEN STORE cam kết mang đến sản phẩm chất lượng tốt nhất với chính sách đổi trả miễn phí trong 30 ngày.</p>
                `;
                changed = true;
            }
            if (changed) {
                await p.save();
                updatedCount++;
            }
        }
        console.log(`Đã cập nhật Mô tả SEO chuẩn cho ${updatedCount} sản phẩm.`);

        // 2. Tạo chiến dịch Flash Sale (Chỉ làm nếu FlashSaleModel tồn tại và đúng cấu trúc)
        if (FlashSaleModel && FlashSaleModel.find) {
            const fsProducts = products.slice(0, 3);
            const flashSaleItems = [];
            
            for (const p of fsProducts) {
                const variant = await ProductVariantModel.findOne({ product_id: p.id });
                if (variant) {
                    flashSaleItems.push({
                        product_id: p.id,
                        variant_id: variant._id,
                        original_price: p.price,
                        flash_sale_price: Math.round(p.price * 0.7), // Giảm 30%
                        stock_allocated: 10,
                        stock_sold: 0
                    });
                }
            }

            if (flashSaleItems.length > 0) {
                await FlashSaleModel.deleteMany({ status: 'active' });
                const now = new Date();
                const tomorrow = new Date();
                tomorrow.setDate(now.getDate() + 1);

                const flashSale = new FlashSaleModel({
                    name: 'KHAI TRƯƠNG BÙNG NỔ',
                    startTime: now,
                    endTime: tomorrow,
                    status: 'active',
                    items: flashSaleItems
                });
                await flashSale.save();
                console.log(`Đã khởi chạy chiến dịch Flash Sale "KHAI TRƯƠNG BÙNG NỔ" với ${flashSaleItems.length} sản phẩm.`);
            }
        } else {
             console.log('Không tìm thấy model FlashSaleModel, bỏ qua.');
        }
    } catch (e) {
        console.error('Lỗi chạy kịch bản:', e);
    } finally {
        process.exit(0);
    }
});
