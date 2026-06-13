# 🛍️ LUXE FASHION - Website Bán Hàng Thời Trang

Website thời trang hiện đại với **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, và **Nodemailer**.

## ✨ Tính năng chính

### 🎨 Frontend (Giao diện)
- ✅ **Hero Section** với video background và animation mượt mà
- ✅ **Danh mục sản phẩm** với hover effects và image zoom
- ✅ **Bộ lọc thông minh**: Size, Màu sắc, Giá, Danh mục
- ✅ **Product Card** với dual-image hover swap
- ✅ **Chi tiết sản phẩm** với gallery, size/color selector
- ✅ **Giỏ hàng Drawer** slide-in từ bên phải
- ✅ **Responsive Design** hoàn hảo trên mọi thiết bị
- ✅ **Framer Motion animations** mượt mà

### ⚙️ Backend (Xử lý)
- ✅ **API Route** `/api/orders` xử lý đặt hàng
- ✅ **Nodemailer** gửi email xác nhận tự động
- ✅ **Email Template** HTML chuyên nghiệp
- ✅ **Validation** dữ liệu phía server
- ✅ **TypeScript** type-safe toàn bộ

### 🛒 Luồng mua hàng
1. Khách chọn sản phẩm → Thêm vào giỏ
2. Xem giỏ hàng → Điều chỉnh số lượng
3. Thanh toán → Điền thông tin
4. Nhấn "Đặt hàng" → Backend xử lý
5. Gửi email xác nhận → Hiển thị modal thành công

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
cd fashion-store
npm install
```

### 2. Cấu hình Email (Quan trọng!)
Mở file `.env.local` và thay đổi:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Hướng dẫn tạo Gmail App Password:**
1. Vào https://myaccount.google.com/security
2. Bật "Xác minh 2 bước" (2-Step Verification)
3. Tìm "App passwords" → Tạo mật khẩu ứng dụng
4. Chọn "Mail" và "Windows Computer"
5. Copy mật khẩu 16 ký tự và dán vào `EMAIL_PASS`

### 3. Chạy Development Server
```bash
npm run dev
```

Website sẽ chạy tại: **http://localhost:3000**

### 4. Build Production (tuỳ chọn)
```bash
npm run build
npm start
```

## 📁 Cấu trúc dự án

```
fashion-store/
├── src/
│   ├── app/
│   │   ├── api/orders/route.ts      # Backend API xử lý đơn hàng
│   │   ├── checkout/page.tsx        # Trang thanh toán
│   │   ├── product/[id]/page.tsx    # Chi tiết sản phẩm
│   │   ├── products/page.tsx        # Danh sách sản phẩm
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── Header.tsx               # Header với cart badge
│   │   ├── Hero.tsx                 # Hero section
│   │   ├── CategorySection.tsx      # Danh mục nổi bật
│   │   ├── NewArrivals.tsx          # Sản phẩm mới
│   │   ├── ProductCard.tsx          # Card sản phẩm
│   │   ├── ProductFilter.tsx        # Bộ lọc sản phẩm
│   │   ├── CartDrawer.tsx           # Giỏ hàng drawer
│   │   ├── CheckoutForm.tsx         # Form thanh toán
│   │   ├── OrderSuccessModal.tsx    # Modal thành công
│   │   ├── FeaturesBanner.tsx       # Banner tính năng
│   │   ├── Newsletter.tsx           # Đăng ký email
│   │   └── Footer.tsx               # Footer
│   ├── context/
│   │   └── CartContext.tsx          # Global cart state
│   ├── data/
│   │   └── products.ts              # Dữ liệu sản phẩm
│   ├── lib/
│   │   └── emailTemplate.ts         # Email HTML template
│   └── types/
│       └── index.ts                 # TypeScript types
├── .env.local                       # Environment variables
└── package.json
```

## 🎨 Công nghệ sử dụng

- **Next.js 15** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Nodemailer** - Email sending
- **React Context** - State management

## 📧 Cấu hình Email chi tiết

### Sử dụng Gmail SMTP (Miễn phí)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx  # App Password 16 ký tự
```

### Sử dụng dịch vụ khác (Resend, SendGrid, etc.)
Thay đổi code trong `src/app/api/orders/route.ts`:

```typescript
// Ví dụ với Resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

## 🔧 Tùy chỉnh

### Thay đổi sản phẩm
Chỉnh sửa file `src/data/products.ts`

### Thay đổi màu sắc
Chỉnh sửa `tailwind.config.ts` hoặc `globals.css`

### Thay đổi email template
Chỉnh sửa `src/lib/emailTemplate.ts`

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🐛 Troubleshooting

### Email không gửi được?
1. Kiểm tra `.env.local` đã đúng chưa
2. Đảm bảo dùng App Password, không phải mật khẩu Gmail
3. Kiểm tra console log để xem lỗi chi tiết

### Lỗi build?
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📝 To-Do (Mở rộng sau)

- [ ] Kết nối database (MongoDB/PostgreSQL)
- [ ] Authentication (đăng nhập/đăng ký)
- [ ] Admin dashboard quản lý sản phẩm
- [ ] Payment gateway (Stripe, PayPal, MoMo)
- [ ] Order tracking
- [ ] Product reviews
- [ ] Wishlist persistence
- [ ] Search functionality

## 👨‍💻 Tác giả

Được thiết kế và phát triển bởi **Hậu** - FPT Polytechnic Student

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập và thương mại.

---

**Chúc bạn thành công! 🎉**
