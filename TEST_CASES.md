# KẾ HOẠCH KIỂM THỬ (TEST CASES) - PH STORE

Dưới đây là các kịch bản kiểm thử (Test Cases) được xây dựng dựa trên cấu trúc chuẩn của bạn, áp dụng trực tiếp cho các tính năng thực tế đang hoạt động trên hệ thống **PH Store (Haven Store)** hiện tại.

## 1. Module: Quản lý Bài viết (Admin Panel)

| TC ID | Test Case Title | Kết quả mong đợi | Kết quả thực tế | Người test | Ngày test | Chi tiết bước kiểm tra | Ghi chú |
|---|---|---|---|---|---|---|---|
| ART-01 | Thêm bài viết để trống tiêu đề và nội dung | Hiển thị thông báo lỗi 'Vui lòng nhập tiêu đề' | Hiển thị thông báo lỗi 'Vui lòng nhập tiêu đề' | Trọng Nghĩa | 30/06/2026 | 1. Mở trang Admin > Bài viết<br>2. Nhấn 'Thêm bài viết'<br>3. Để trống Tiêu đề và Nội dung<br>4. Nhấn 'Thêm bài viết' | PASS |
| ART-02 | Thêm bài viết chỉ nhập tiêu đề, bỏ trống nội dung | Hiển thị thông báo lỗi 'Vui lòng nhập nội dung' | Hiển thị thông báo lỗi 'Vui lòng nhập nội dung' | Trọng Nghĩa | 30/06/2026 | 1. Mở form Thêm bài viết<br>2. Nhập tiêu đề<br>3. Bỏ trống nội dung<br>4. Nhấn 'Thêm bài viết' | PASS |
| ART-03 | Thêm bài viết hợp lệ (tự động sinh slug & tóm tắt) | Thêm thành công, hiển thị thông báo '✅ Đã thêm bài viết mới'. Tự động sinh URL slug và đoạn tóm tắt. | Thêm thành công, hiển thị thông báo '✅ Đã thêm bài viết mới'. Slug và excerpt tự động hiển thị trên bảng. | Trọng Nghĩa | 30/06/2026 | 1. Mở form Thêm bài viết<br>2. Nhập Tiêu đề và Nội dung<br>3. Để trống Slug và Tóm tắt<br>4. Nhấn 'Thêm bài viết' | PASS |
| ART-04 | Lọc bài viết theo trạng thái | Danh sách chỉ hiển thị các bài viết có trạng thái tương ứng (vd: Nháp hoặc Xuất bản) | Bảng dữ liệu lọc chính xác, chỉ hiện các bài viết đúng trạng thái | Trọng Nghĩa | 30/06/2026 | 1. Mở trang Bài viết<br>2. Chọn filter '✅ Đã xuất bản'<br>3. Kiểm tra danh sách | PASS |
| ART-05 | Xóa bài viết | Hiển thị modal xác nhận. Xóa thành công hiển thị 'Đã xóa bài viết' và mất khỏi danh sách. | Hiển thị modal xác nhận, xóa thành công và bảng dữ liệu được cập nhật lại. | Trọng Nghĩa | 30/06/2026 | 1. Chọn 1 bài viết<br>2. Nhấn icon Xóa<br>3. Nhấn 'Xóa' trên Modal xác nhận | PASS |

## 2. Module: Xem Blog / Tin tức (Người dùng)

| TC ID | Test Case Title | Kết quả mong đợi | Kết quả thực tế | Người test | Ngày test | Chi tiết bước kiểm tra | Ghi chú |
|---|---|---|---|---|---|---|---|
| BLG-01 | Truy cập trang Thông tin (Blog) | Hiển thị danh sách các bài viết có trạng thái 'Đã xuất bản' (Published), dạng lưới Card | Hiển thị thành công lưới Card tin tức kèm Tiêu đề, ảnh, tóm tắt và lượt xem | Trọng Nghĩa | 30/06/2026 | 1. Ở trang chủ, bấm Menu 'Thông tin'<br>2. Quan sát giao diện danh sách | PASS |
| BLG-02 | Lọc bài viết theo danh mục ngoài Frontend | Chỉ hiển thị các bài viết thuộc danh mục được chọn (vd: Xu hướng) | Chỉ hiển thị các thẻ bài viết thuộc danh mục tương ứng | Trọng Nghĩa | 30/06/2026 | 1. Tại trang Thông tin, bấm nút danh mục 'Xu hướng'<br>2. Kiểm tra các bài viết bên dưới | PASS |
| BLG-03 | Xem chi tiết bài viết | Chuyển hướng sang `/about/[slug]`, hiển thị đầy đủ nội dung bài viết định dạng chuẩn HTML | Chuyển trang thành công, nội dung hiển thị đẹp, có đủ ảnh và các thẻ Heading | Trọng Nghĩa | 30/06/2026 | 1. Bấm vào nút 'Đọc tiếp' trên 1 bài viết<br>2. Kiểm tra layout chi tiết bài viết | PASS |
| BLG-04 | Xem bài viết không tồn tại (sai slug) | Hiển thị giao diện báo lỗi 404 - "Bài viết không tồn tại hoặc đã bị xóa" cùng nút Trở về | Hiển thị đúng giao diện lỗi 404 thân thiện | Trọng Nghĩa | 30/06/2026 | 1. Nhập URL `/about/slug-linh-tinh-khong-co`<br>2. Quan sát kết quả | PASS |

## 3. Module: Quản lý Mã giảm giá (Admin Panel)

| TC ID | Test Case Title | Kết quả mong đợi | Kết quả thực tế | Người test | Ngày test | Chi tiết bước kiểm tra | Ghi chú |
|---|---|---|---|---|---|---|---|
| CPN-01 | Thêm mã giảm giá với Mã code trùng lặp | Hiển thị thông báo lỗi 'Mã code đã tồn tại' | Hiển thị lỗi 'Mã code đã tồn tại', không lưu dữ liệu | Trọng Nghĩa | 30/06/2026 | 1. Mở Admin > Mã giảm giá<br>2. Nhập Code giống code đã có<br>3. Bấm Lưu | PASS |
| CPN-02 | Thêm mã giảm giá hợp lệ | Lưu thành công, hiển thị lên danh sách, báo 'Thêm thành công' | Lưu thành công, mã mới xuất hiện trên bảng danh sách | Trọng Nghĩa | 30/06/2026 | 1. Nhập đủ Code, Loại giảm giá, Giá trị, Hạn sử dụng<br>2. Bấm Lưu | PASS |
| CPN-03 | Cập nhật số lượt sử dụng tối đa | Lưu thành công, mã giảm giá thay đổi số giới hạn trên hệ thống | Cập nhật thành công, số lượng được làm mới trong bảng | Trọng Nghĩa | 30/06/2026 | 1. Bấm Sửa 1 mã<br>2. Đổi 'Số lượt sử dụng'<br>3. Bấm Lưu | PASS |

## 4. Module: Xác thực (Đăng nhập / Đăng ký)
*(Đã điều chỉnh sát với cơ chế hiển thị lỗi Toast/Form của PH Store)*

| TC ID | Test Case Title | Kết quả mong đợi | Kết quả thực tế | Người test | Ngày test | Chi tiết bước kiểm tra | Ghi chú |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Đăng nhập để trống thông tin | Hiển thị thông báo lỗi 'Vui lòng điền đầy đủ thông tin' / 'Email không hợp lệ' | Hiển thị thông báo lỗi đỏ yêu cầu nhập liệu | Trọng Nghĩa | 30/06/2026 | 1. Mở trang Đăng nhập<br>2. Để trống Email & Pass<br>3. Bấm Đăng nhập | PASS |
| AUTH-02 | Đăng nhập sai mật khẩu / email | Hiển thị thông báo 'Email hoặc mật khẩu không chính xác' | Hiển thị Toast thông báo lỗi tài khoản không đúng | Trọng Nghĩa | 30/06/2026 | 1. Mở trang Đăng nhập<br>2. Nhập Email đúng, Pass sai<br>3. Bấm Đăng nhập | PASS |
| AUTH-03 | Đăng nhập hợp lệ | Hiển thị 'Đăng nhập thành công', load lại trạng thái Header, lưu Token vào localStorage, chuyển hướng trang chủ | Đăng nhập thành công, chuyển hướng về trang chủ và hiện tên user ở góc phải | Trọng Nghĩa | 30/06/2026 | 1. Nhập đúng Email và Mật khẩu<br>2. Bấm Đăng nhập | PASS |
| AUTH-04 | Đăng ký với mật khẩu ngắn (< 6 ký tự) | Form hiển thị cảnh báo 'Mật khẩu phải có ít nhất 6 ký tự' | Báo lỗi ngay tại trường nhập liệu Mật khẩu | Trọng Nghĩa | 30/06/2026 | 1. Mở trang Đăng ký<br>2. Nhập Pass: "123"<br>3. Bấm Đăng ký | PASS |
| AUTH-05 | Đăng ký email đã tồn tại | Báo lỗi 'Email này đã được đăng ký, vui lòng sử dụng email khác' | Hiển thị popup/toast lỗi trùng email | Trọng Nghĩa | 30/06/2026 | 1. Nhập email của tài khoản đã tồn tại<br>2. Nhập mật khẩu<br>3. Bấm Đăng ký | PASS |
