/**
 * ============================================================
 * SCRIPT: SEED DỮ LIỆU BÀI VIẾT MẪU
 * Cách chạy: node backend/scripts/seedArticles.js
 *
 * ⚠️ QUAN TRỌNG: Chạy script này sẽ XÓA tất cả bài viết cũ
 *    và thêm dữ liệu mẫu mới. Chỉ dùng khi cần reset dữ liệu.
 * ============================================================
 */
const path = require('path');
// ⭐ Thử nhiều vị trí .env khác nhau
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
const mongoose = require('mongoose');
const Article  = require('../src/models/Article');

// ─── Kết nối MongoDB ────────────────────────────────────────
async function connectDB() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ Thiếu MONGODB_URI trong .env.local');
        process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('✅ Đã kết nối MongoDB');
}

// ─── Dữ liệu bài viết mẫu ───────────────────────────────────
const sampleArticles = [
    {
        title: 'Xu hướng thời trang hè 2025: Tươi mát và cá tính',
        slug: 'xu-huong-thoi-trang-he-2025',
        excerpt: 'Mùa hè 2025 mang đến những làn sóng thời trang mới mẻ với gam màu pastel tươi sáng, chất liệu linen thoáng mát và các thiết kế tối giản nhưng đầy cá tính.',
        content: `<h2>Xu hướng màu sắc nổi bật hè 2025</h2>
<p>Mùa hè năm nay, các nhà thiết kế hàng đầu thế giới đều đồng thuận chọn <strong>gam màu pastel</strong> làm chủ đạo. Các tông màu như xanh baby, hồng nude, và vàng kem sẽ thống trị tủ quần áo của bạn.</p>
<h2>Chất liệu được ưa chuộng</h2>
<p>Linen và cotton hữu cơ là hai chất liệu được ưa chuộng nhất. Không chỉ thoáng mát, chúng còn thân thiện với môi trường — xu hướng <em>sustainable fashion</em> đang ngày càng được chú trọng.</p>
<h2>Kiểu dáng đáng thử năm nay</h2>
<ul>
<li>Áo sơ mi oversized với quần baggy</li>
<li>Váy midi floral nhẹ nhàng</li>
<li>Bộ co-ord set màu trung tính</li>
<li>Áo crop top kết hợp quần lưng cao</li>
</ul>
<p>Hãy thử mix & match để tạo ra phong cách riêng của bạn!</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
        category: 'xu-huong',
        status: 'published',
        tags: ['xu hướng', 'hè 2025', 'pastel', 'linen'],
        views: 1240
    },
    {
        title: '5 bí quyết phối đồ công sở thanh lịch cho nữ',
        slug: 'bi-quyet-phoi-do-cong-so-thanh-lich',
        excerpt: 'Trang phục công sở không nhất thiết phải nhàm chán. Khám phá 5 bí quyết giúp bạn luôn trông chuyên nghiệp mà vẫn đầy phong cách mỗi ngày đến văn phòng.',
        content: `<h2>1. Đầu tư vào các items cơ bản chất lượng</h2>
<p>Những món đồ cơ bản như blazer đen, quần âu trắng, và áo sơ mi trắng sẽ là nền tảng vững chắc cho tủ đồ công sở của bạn. Chọn chất liệu tốt để đảm bảo độ bền.</p>
<h2>2. Phối màu thông minh</h2>
<p>Nguyên tắc <strong>60-30-10</strong>: 60% màu chủ đạo (thường là trung tính), 30% màu phụ, 10% màu nhấn. Đơn giản nhưng cực kỳ hiệu quả!</p>
<h2>3. Chú ý đến phụ kiện</h2>
<p>Một chiếc đồng hồ lịch sự, túi da gọn gàng hoặc chuỗi hạt tinh tế có thể nâng tầm cả bộ đồ đơn giản nhất.</p>
<h2>4. Cân nhắc tỷ lệ cơ thể</h2>
<p>Áo rộng → quần bó và ngược lại. Nguyên tắc này giúp tổng thể trông cân đối và thanh thoát hơn.</p>
<h2>5. Luôn giữ trang phục phẳng phiu, gọn gàng</h2>
<p>Đây là yếu tố cơ bản nhưng quan trọng nhất. Quần áo sạch sẽ, không nhàu nát sẽ tạo ấn tượng chuyên nghiệp ngay lập tức.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4b9d42?w=800&q=80',
        category: 'tips',
        status: 'published',
        tags: ['công sở', 'tips phối đồ', 'nữ', 'thanh lịch'],
        views: 856
    },
    {
        title: 'Haven Store ra mắt bộ sưu tập Thu Đông 2025',
        slug: 'haven-store-bst-thu-dong-2025',
        excerpt: 'Haven Store chính thức giới thiệu bộ sưu tập Thu Đông 2025 với chủ đề "Warm Minimalism" — sự ấm áp trong từng đường nét tối giản.',
        content: `<h2>Chủ đề: Warm Minimalism</h2>
<p>Bộ sưu tập Thu Đông 2025 của Haven Store lấy cảm hứng từ triết học tối giản Nhật Bản kết hợp với hơi thở ấm áp của mùa thu châu Âu.</p>
<h2>Điểm nhấn của bộ sưu tập</h2>
<p>Các thiết kế tập trung vào <strong>chất liệu cao cấp</strong>: wool Merino, cashmere blend và cotton dày dặn. Màu sắc chủ đạo là camel, nâu đất, xanh navy đậm và kem trắng.</p>
<h2>Những items không thể bỏ qua</h2>
<ul>
<li>Áo khoác teddy coat màu camel</li>
<li>Áo len cổ lọ oversize</li>
<li>Quần corduroy wide-leg</li>
<li>Áo cardigan dài phối belt</li>
</ul>
<h2>Thông tin ra mắt</h2>
<p>Bộ sưu tập sẽ chính thức có mặt tại Haven Store từ <strong>01/09/2025</strong>. Khách hàng thành viên được ưu tiên mua trước từ ngày 28/08.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
        category: 'tin-tuc',
        status: 'published',
        tags: ['bộ sưu tập', 'thu đông', '2025', 'new arrival'],
        views: 2100
    },
    {
        title: 'Hướng dẫn chọn size quần áo chuẩn nhất',
        slug: 'huong-dan-chon-size-quan-ao',
        excerpt: 'Mua sắm online thường gặp rắc rối về size. Bài viết này sẽ giúp bạn hiểu cách đọc bảng size và chọn đúng size phù hợp với cơ thể.',
        content: `<h2>Tại sao chọn đúng size lại quan trọng?</h2>
<p>Quần áo đúng size không chỉ giúp bạn thoải mái mà còn tôn lên vóc dáng và tạo ấn tượng tốt hơn trong mắt người đối diện.</p>
<h2>Cách đo số đo cơ thể</h2>
<p>Bạn cần đo 3 số đo cơ bản:</p>
<ul>
<li><strong>Vòng ngực (bust):</strong> Đo phần đầy nhất của ngực</li>
<li><strong>Vòng eo (waist):</strong> Đo phần nhỏ nhất của eo</li>
<li><strong>Vòng hông (hip):</strong> Đo phần đầy nhất của hông</li>
</ul>
<h2>Bảng quy đổi size Haven Store</h2>
<table>
<tr><th>Size</th><th>Ngực (cm)</th><th>Eo (cm)</th><th>Hông (cm)</th></tr>
<tr><td>XS</td><td>76-80</td><td>60-64</td><td>84-88</td></tr>
<tr><td>S</td><td>80-84</td><td>64-68</td><td>88-92</td></tr>
<tr><td>M</td><td>84-88</td><td>68-72</td><td>92-96</td></tr>
<tr><td>L</td><td>88-92</td><td>72-76</td><td>96-100</td></tr>
<tr><td>XL</td><td>92-96</td><td>76-80</td><td>100-104</td></tr>
</table>
<h2>Lưu ý khi mua online</h2>
<p>Luôn đọc phần mô tả sản phẩm vì một số mẫu được thiết kế <em>oversized</em> nên có thể cần lấy size nhỏ hơn 1 size so với thông thường.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
        category: 'tips',
        status: 'published',
        tags: ['hướng dẫn', 'chọn size', 'mua sắm online'],
        views: 3450
    },
    {
        title: 'Sustainable Fashion: Thời trang bền vững là gì?',
        slug: 'sustainable-fashion-thoi-trang-ben-vung',
        excerpt: 'Sustainable fashion đang trở thành xu hướng toàn cầu. Cùng tìm hiểu thời trang bền vững là gì và tại sao bạn nên quan tâm đến nó.',
        content: `<h2>Sustainable Fashion là gì?</h2>
<p><strong>Thời trang bền vững</strong> (Sustainable Fashion) là phong trào hướng đến việc sản xuất và tiêu thụ quần áo theo cách có trách nhiệm với môi trường và xã hội.</p>
<h2>Tại sao ngành thời trang cần thay đổi?</h2>
<p>Ngành thời trang hiện là một trong những ngành công nghiệp gây ô nhiễm lớn thứ 2 thế giới. Mỗi năm có hàng tỷ kg quần áo bị đổ vào bãi rác.</p>
<h2>Bạn có thể làm gì?</h2>
<ul>
<li>Mua ít hơn nhưng chọn đồ chất lượng cao</li>
<li>Ưu tiên các thương hiệu có cam kết bền vững</li>
<li>Thử second-hand và vintage</li>
<li>Học cách vá, sửa quần áo thay vì vứt bỏ</li>
<li>Chọn chất liệu tự nhiên: cotton hữu cơ, linen, tencel</li>
</ul>
<h2>Haven Store cam kết gì?</h2>
<p>Chúng tôi cam kết sử dụng <strong>70% chất liệu có nguồn gốc bền vững</strong> vào năm 2026 và đóng gói bằng vật liệu tái chế 100%.</p>`,
        thumbnail: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
        category: 'xu-huong',
        status: 'published',
        tags: ['sustainable', 'môi trường', 'thời trang xanh'],
        views: 987
    }
];

// ─── Hàm thực thi seed ──────────────────────────────────────
async function seedArticles() {
    await connectDB();

    // Xóa tất cả bài viết cũ
    const deleted = await Article.deleteMany({});
    console.log(`🗑️  Đã xóa ${deleted.deletedCount} bài viết cũ`);

    // Thêm bài viết mẫu
    const inserted = await Article.insertMany(sampleArticles);
    console.log(`✅ Đã thêm ${inserted.length} bài viết mẫu:`);
    inserted.forEach(a => console.log(`   - [${a.category}] ${a.title}`));

    await mongoose.disconnect();
    console.log('\n🎉 Seed dữ liệu hoàn tất!');
    process.exit(0);
}

seedArticles().catch(err => {
    console.error('❌ Lỗi seed:', err.message);
    process.exit(1);
});
