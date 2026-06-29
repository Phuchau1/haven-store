/**
 * ============================================================
 * ZUSTAND STORE: XÁC THỰC NGƯỜI DÙNG (Auth Store)
 * Mô tả: Lưu trữ thông tin đăng nhập của người dùng trong bộ nhớ
 *        toàn cục (global state) và tự động đồng bộ với localStorage
 *        nhờ middleware `persist` của Zustand.
 *
 * Cách hoạt động:
 *  - Khi đăng nhập thành công → gọi login() → lưu user vào store + localStorage
 *  - Khi reload trang → Zustand tự đọc lại từ localStorage (rehydrate)
 *  - Khi đăng xuất → gọi logout() → xóa user khỏi store + localStorage
 * ============================================================
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ---------- Kiểu dữ liệu: Thông tin người dùng ---------- */
export interface User {
    id:       string;   // ID định danh người dùng (dùng để gửi lên backend)
    name:     string;   // Tên hiển thị
    email:    string;   // Email đăng nhập
    role:     string;   // Quyền: 'user' | 'admin' | 'warehouse_manager'...
    phone?:   string;   // Số điện thoại (tùy chọn)
    address?: string;   // Địa chỉ mặc định (tùy chọn)
    avatar?:  string;   // URL ảnh đại diện (tùy chọn)
}

/* ---------- Kiểu dữ liệu: Cấu trúc store ---------- */
interface AuthStore {
    user:               User | null;                             // Thông tin user đang đăng nhập (null = chưa đăng nhập)
    token:              string | null;                           // Token xác thực (hiện dùng user.id)
    login:              (user: User, token?: string) => void;   // Action đăng nhập
    logout:             () => void;                              // Action đăng xuất
    updateUserLocally:  (data: Partial<User>) => void;          // Cập nhật thông tin user tại client (không gọi API)
}

/* ---------- Tạo Zustand Store với middleware persist ---------- */
export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            // Giá trị mặc định ban đầu (chưa đăng nhập)
            user:  null,
            token: null,

            // Đăng nhập: lưu user và token vào store
            login: (user, token) =>
                set((state) => ({ user, token: token || state.token })),

            // Đăng xuất: xóa toàn bộ thông tin xác thực
            logout: () => set({ token: null, user: null }),

            // Cập nhật hồ sơ cục bộ (merge với dữ liệu cũ)
            updateUserLocally: (data) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null
                }))
        }),
        {
            name:          'phstore-user', // Tên key trong localStorage
            skipHydration: true,           // Bỏ qua hydration tự động — tự rehydrate thủ công bên dưới
        }
    )
);

/* ---------- Khôi phục trạng thái từ localStorage sau khi mount (chỉ trên client) ---------- */
// Cần thiết vì Next.js render trên server không có localStorage
if (typeof window !== 'undefined') {
    useAuthStore.persist.rehydrate();
}
