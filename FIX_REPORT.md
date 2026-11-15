# BÁO CÁO BÀN GIAO: SỬA LỖI & HOÀN THIỆN NGHIỆP VỤ ĐƠN HÀNG
**Hệ thống Thời trang Youth Fashion System**
**Nhánh:** `fix/order-flow` (tạo từ `nganttk`)
**Tác giả Commit:** `Kimngan1303 <kimngan1303@gmail.com>`

---

## 1. TỔNG QUAN KẾT QUẢ ĐẠT ĐƯỢC
- **Backend Test Suite (`npm test`):** 9/9 kịch bản kiểm thử tự động đạt 100% PASS rate.
- **Frontend Build (`npm run build`):** Biên dịch thành công 0 lỗi.
- **Kiểm tra ESLint (`no-undef` & `react/jsx-no-undef`):** 0 lỗi.
- **Playwright E2E Screenshots:** Đã chụp và lưu trữ 7 ảnh minh chứng trong thư mục `docs/e2e-screenshots/`.
- **Nguồn dữ liệu chân lý (Single Source of Truth):** Toàn bộ trạng thái đơn hàng, thanh toán, thông báo được lưu trữ và kiểm soát bởi Backend CSDL MySQL (Prisma ORM). `localStorage` chỉ đóng vai trò cache hỗ trợ phản hồi giao diện.

---

## 2. CHI TIẾT DANH SÁCH LỖI VÀ TÍNH NĂNG ĐÃ HOÀN THÀNH

### A. [Nghiêm trọng] Job tự hủy đơn sau 5 phút (`be/src/config/paymentExpiration.job.js`)
- **Trước khi sửa:** Job tự hủy tất cả đơn hàng có trạng thái `PENDING` quá 5 phút, bao gồm cả các đơn COD đang chờ xác nhận duyệt bởi Manager.
- **Sau khi sửa:** Chỉ hủy các đơn hàng có phương thức thanh toán `PAYOS` và `payment_status = 'PENDING'` quá 5 phút. Đơn COD được giữ nguyên ở `PENDING` để nhân viên cửa hàng xử lý. Khi tự hủy, hệ thống thực hiện transaction an toàn: hoàn lại tồn kho cho từng sản phẩm, giảm `used_count` của voucher, cập nhật payment sang `CANCELLED`, ghi lại `OrderStatusHistory`, tạo bản ghi `Notification` trong CSDL và gửi email thông báo hủy đơn cho khách hàng.

### B. [Nghiêm trọng] Khớp sai đơn và gửi email trùng lặp
- **Trước khi sửa:** `order.repository.js` tìm kiếm đơn hàng bằng toán tử lỏng lẻo `contains` và OR nhiều trường, dẫn đến đơn `YF-123` bị cập nhật nhầm sang `YF-1234`. Ngoài ra, `OrderManager.jsx` gọi `updateOrderStatus` tới 3 lần lặp lại, và email được kích hoạt gửi ở cả Frontend lẫn Backend.
- **Sau khi sửa:**
  - `findOrderByIdOrNumber`, `findOrderAny`, `deleteOrderById` chỉ tìm kiếm chính xác tuyệt đối theo `order_id` hoặc `order_number`.
  - `OrderManager.jsx` chỉ gọi đúng 1 lần `orderService.updateOrderStatus(order_id, status)` có `await`, cập nhật giao diện sau khi Backend xác nhận thành công.
  - Loại bỏ hoàn toàn việc Frontend gọi API `/orders/notify-email` khi đổi trạng thái; chỉ có Backend chịu trách nhiệm phát email đơn lẻ chuẩn xác.

### C. [Nghiêm trọng] Phân quyền API đơn hàng (RBAC) & Endpoint dành riêng cho Khách hàng
- **Trước khi sửa:** Toàn bộ route quản lý đơn chỉ dùng `optionalAuth`, không kiểm tra vai trò người gọi. Khách hàng có thể gọi trực tiếp endpoint đổi trạng thái của Manager.
- **Sau khi sửa:**
  - Bảo vệ nghiêm ngặt các route quản trị: `GET /api/orders`, `PATCH /api/orders/:id/status`, `DELETE /api/orders/:id`, `DELETE /api/orders/clear-all`, `POST /api/orders/notify-email` bắt buộc `authenticateToken` + `authorizeRoles('ADMIN', 'MANAGER')`.
  - Khởi tạo các endpoint riêng biệt cho khách hàng:
    - `PATCH /api/orders/customer/:id/cancel`: Khách hàng chỉ được hủy khi đơn đang ở trạng thái `PENDING` và đơn phải thuộc chính khách hàng đó.
    - `POST /api/orders/customer/:id/refund-request`: Khách gửi yêu cầu hoàn tiền cho đơn PayOS bị hủy kèm thông tin STK ngân hàng.
    - `PATCH /api/orders/customer/:id/confirm-delivered`: Khách xác nhận "Đã nhận được hàng" khi đơn ở `DELIVERED`.
  - Xóa bỏ hoàn toàn hàm gọi `clearAllOrders()` nguy hiểm trong `ProfilePage.jsx`.
  - Mã nhân viên thao tác (`employeeId`) được trích xuất an toàn từ decoded JWT token, không lấy từ request body.

### D. Webhook PayOS & Đồng bộ trạng thái thanh toán
- **Trước khi sửa:** Webhook PayOS tự động chuyển đơn sang `CONFIRMED` khi thanh toán thành công, và không kiểm tra chặt chẽ checksum nếu thiếu cấu hình.
- **Sau khi sửa:**
  - Kiểm tra chữ ký webhook PayOS bắt buộc; nếu chữ ký sai hoặc thiếu cấu hình checksum, webhook trả về mã lỗi 400 và từ chối xử lý.
  - Tính năng Idempotent: gọi lại webhook nhiều lần không gửi lặp email và không ghi trùng lịch sử trạng thái.
  - Khi thanh toán PayOS thành công: `payment_status = 'SUCCESS'`, nhưng đơn hàng **vẫn giữ nguyên ở trạng thái `PENDING` (Chờ xác nhận)** để nhân viên quản lý duyệt trước khi xuất hàng.
  - Bổ sung đầy đủ các biến môi trường vào `be/.env.example`.

### E. Quản lý Tồn kho & Voucher nguyên tử (Atomic Transactions)
- Sử dụng Prisma Transaction `$transaction` để đồng bộ hoàn tồn kho `stock` và lượt dùng `used_count` của voucher khi đơn hàng bị hủy (bởi khách hàng, bởi shop hoặc bởi cronjob).
- Có cơ chế chặn hoàn lặp (double-restoration): nếu đơn hàng đã ở trạng thái `CANCELLED`, mọi thao tác hủy kế tiếp đều không cộng thêm tồn kho.
- Voucher của đơn PayOS chỉ được ghi nhận đã sử dụng khi thanh toán thành công.

### F. Chuông Thông báo Web CSDL & Xóa thông báo triệt để
- Triển khai toàn diện bảng `Notification` trong CSDL MySQL và xây dựng API RESTful:
  - `GET /api/notifications`: Lấy danh sách thông báo của tài khoản đang đăng nhập.
  - `PATCH /api/notifications/:id/read`: Đánh dấu đã đọc 1 thông báo.
  - `PATCH /api/notifications/read-all`: Đánh dấu đã đọc tất cả thông báo.
  - `DELETE /api/notifications/:id`: Xóa vĩnh viễn 1 thông báo.
  - `DELETE /api/notifications`: Xóa vĩnh viễn toàn bộ thông báo.
- Frontend (`NotificationPage.jsx` và dropdown thông báo tại `Header.jsx`) tải dữ liệu trực tiếp từ API Backend.
- Bổ sung nút **Xóa từng thông báo** (biểu tượng thùng rác) bên cạnh nút Xóa tất cả.
- Loại bỏ hoàn toàn vòng lặp đối soát tự phục hồi thông báo thừa từ `localStorage` - nguyên nhân gây lỗi xóa xong tải lại trang vẫn hiện lại.

### G. Khắc phục lỗi Biến chưa khai báo (ReferenceError)
- Khai báo biến `isActuallyApproved` và `isActuallyRejected` ở phạm vi ngoài trong `ProfilePage.jsx`.
- Khai báo state `showCategoryMenu` trong `Header.jsx`.
- Bổ sung `showError` vào destructuring `useToast()` trong `ProductDetailPage.jsx`.

### H. Nút Yêu cầu Hoàn tiền phía Khách hàng
- Nút "Yêu Cầu Hoàn Tiền" chỉ hiển thị khi đơn hàng bị Shop/Manager hủy VÀ phương thức thanh toán là `PAYOS` VÀ đã thanh toán thành công.
- Ẩn hoàn toàn với các đơn COD (tiền mặt khi nhận hàng) bị hủy.

### I. Trạng thái Đơn hàng Mới & Chu trình Nghiệp vụ Chuẩn
- Bổ sung vào enum `OrderStatus` trong CSDL: `DELIVERY_FAILED`, `COMPLETED`.
- Bổ sung các trường thời gian vào model `Order`: `customer_received_at`, `delivered_at`, `completed_at`, `delivery_attempts`, `voucher_code`.
- Chu trình chuyển đổi trạng thái hợp lệ tuần tự (State Machine):
  - `PENDING → CONFIRMED | CANCELLED`
  - `CONFIRMED → SHIPPED | CANCELLED`
  - `SHIPPED → DELIVERED | DELIVERY_FAILED`
  - `DELIVERY_FAILED → SHIPPED (giao lại) | CANCELLED (chuyển hoàn)` (ghi nhận số lần giao thất bại)
  - `DELIVERED → COMPLETED | RETURNED`
  - `CANCELLED → RETURNED` (chỉ dành cho đơn PayOS đã thanh toán khi shop hủy)
  - `COMPLETED`, `RETURNED`: Trạng thái cuối cùng.
- Bổ sung tab **"Đã giao"** và **"Hoàn thành"** ở trang Lịch sử đơn hàng của Khách hàng (`ProfilePage.jsx`).
- Bổ sung tab **"Giao thất bại"** và **"Hoàn thành"** ở trang Quản lý đơn hàng (`OrderManager.jsx`).
- Ở trạng thái `DELIVERY_FAILED`: Cung cấp nút thao tác **"Giao lại"** để đưa đơn về `SHIPPED`.
- Ở trạng thái `DELIVERED`:
  - Khách hàng có nút **"Đã nhận được hàng"** để ghi nhận `customer_received_at`.
  - Phía Quản lý có nút **"Hoàn thành"**: Nút chỉ khả dụng khi khách hàng đã bấm nhận hàng HOẶC đơn hàng đã giao quá thời hạn `ORDER_AUTO_COMPLETE_DAYS` (mặc định 3 ngày). Nếu chưa đủ điều kiện, hệ thống hiển thị cảnh báo hướng dẫn rõ ràng.
- Bổ sung cronjob `processAutoCompleteOrders` định kỳ tự động chuyển các đơn `DELIVERED` quá hạn sang `COMPLETED`.
- Báo cáo doanh thu (`OrderManager.jsx`, `RevenueReport.jsx`): Doanh thu tính theo các đơn hàng `COMPLETED`, đồng thời giữ nguyên tính tương thích lũy kế với các đơn `DELIVERED` trước đó.

---

## 3. TÌM KIẾM TÍNH NĂNG "TỰ ĐỌC TO KHI CHỈ CHUỘT ĐỂ DỊCH" (MỤC 13)
- **Kết quả rà soát mã nguồn:** Đã quét toàn bộ repo Youth Fashion System với các từ khóa `speechSynthesis`, `SpeechRecognition`, `Web Speech API`, `tts`, `text-to-speech`, `translate`, `speak`.
- **Kết luận:** **Trong mã nguồn dự án hoàn toàn KHÔNG có bất kỳ đoạn mã hoặc thư viện nào thực hiện hành vi đọc to văn bản khi rê chuột.**
- **Nguyên nhân thực tế:** Đây là tính năng tích hợp sẵn của Trình duyệt web (ví dụ tính năng "Read Aloud" / "Đọc to lựa chọn" trên Microsoft Edge / Google Chrome) hoặc do Tiện ích mở rộng dịch thuật của bên thứ ba (Google Translate Extension, ImTranslator, Readme TTS, v.v.) mà người dùng đã cài đặt trên trình duyệt.
- **Hướng dẫn tắt tính năng này cho người dùng:**
  1. *Trên Google Chrome / Microsoft Edge:* Kiểm tra danh sách tiện ích mở rộng tại `chrome://extensions/` hoặc `edge://extensions/`. Tạm thời tắt hoặc gỡ bỏ các extension dịch thuật có quyền "Cho phép đọc văn bản được chọn".
  2. *Trong cài đặt Dịch của trình duyệt:* Nhấp chuột phải vào biểu tượng Dịch trên thanh địa chỉ URL → Chọn "Không dịch trang web này" hoặc tắt tùy chọn "Tự động phát âm thanh bản dịch khi di chuột".

---

## 4. BẰNG CHỨNG KIỂM THỬ (TEST & E2E SCREENSHOTS)

### 4.1. Kết quả chạy Automated Backend Tests (`npm test`)
```
> youthfashion-backend@1.0.0 test
> node --test test/**/*.test.js

▶ Youth Fashion Order Flow & Bug Fix Test Suite
  ✔ Scenario 1: Complete Order Lifecycle 1-9 via API with status history & notifications (245.4641ms)
  ✔ Scenario 2: Invalid status transitions return 400 (49.4257ms)
  ✔ Scenario 3: PayOS unpaid expires after 5 mins; COD remains PENDING (33.581ms)
  ✔ Scenario 4: Exact order matching prevents prefix overlap mutation (30.9298ms)
  ✔ Scenario 5: RBAC - Manager routes require ADMIN/MANAGER role; Customer cannot touch other customer order (23.352ms)
  ✔ Scenario 6: PayOS Webhook signature verification and idempotency (2.6194ms)
  ✔ Scenario 7: Atomic stock & voucher restoration on cancellation with double-cancel protection (55.7976ms)
  ✔ Scenario 8: Auto-complete job transitions expired DELIVERED orders to COMPLETED (27.5665ms)
  ✔ Scenario 9: Notification CRUD - deleted notification is not returned in subsequent queries (25.3596ms)
✔ Youth Fashion Order Flow & Bug Fix Test Suite (533.2056ms)

ℹ tests 9
ℹ suites 1
ℹ pass 9
ℹ fail 0
```

### 4.2. Danh sách ảnh chụp màn hình Playwright E2E (`docs/e2e-screenshots/`)
1. `docs/e2e-screenshots/01_customer_orders_tabs.png`: Giao diện Lịch sử đơn hàng khách hàng hiển thị đầy đủ các tab (Chờ xác nhận, Đã xác nhận, Đang vận chuyển, Đã giao, Hoàn thành, Đã hủy, Đổi trả).
2. `docs/e2e-screenshots/02_manager_order_tabs.png`: Giao diện Quản lý đơn hàng hiển thị đầy đủ các tab lọc theo nghiệp vụ chuẩn (bao gồm Giao thất bại và Hoàn thành).
3. `docs/e2e-screenshots/03_delivery_failed_and_retry.png`: Tab Giao thất bại và nút thao tác "Giao lại" đưa đơn về Đang vận chuyển.
4. `docs/e2e-screenshots/04_customer_received_button.png`: Tab Đã giao với nút "Đã nhận được hàng" cho khách hàng xác nhận nhận kiện hàng.
5. `docs/e2e-screenshots/05_manager_completed_action.png`: Tab Hoàn thành và nút thao tác hoàn tất đơn hàng sau khi khách đã xác nhận.
6. `docs/e2e-screenshots/06_payos_refund_request.png`: Đơn hàng PayOS bị shop hủy hiển thị nút "Yêu Cầu Hoàn Tiền" và modal nhập STK ngân hàng.
7. `docs/e2e-screenshots/07_notification_deleted_clean.png`: Trang Trung tâm Thông báo sau khi xóa, làm mới trang không bị nạp lại thông báo rác.
