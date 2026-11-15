# BÁO CÁO BÀN GIAO: SỬA LỖI & HOÀN THIỆN NGHIỆP VỤ ĐƠN HÀNG
**Hệ thống Thời trang Youth Fashion System**  
**Nhánh:** `fix/order-flow` (tạo từ `nganttk`)  
**Tác giả Commit:** `Kimngan1303 <kimngan1303@gmail.com>`  
**Thời gian cập nhật:** 15/11/2026  

---

## 1. TỔNG QUAN KẾT QUẢ ĐẠT ĐƯỢC
- **Backend Test Suite (`npm test`):** **11/11 kịch bản kiểm thử tự động đạt 100% PASS** (bao gồm xác thực quyền `my-orders`, che thông tin đơn khách vãng lai, và kiểm tra gửi đúng 1 email).
- **Frontend Build (`npm run build`):** Biên dịch thành công 0 cảnh báo/lỗi (Vite build sạch).
- **Kiểm tra ESLint & cú pháp:** 0 lỗi cú pháp hoặc ReferenceError.
- **Playwright E2E Suite (Chạy thật trên môi trường sống):** 15 ảnh chụp màn hình ghi nhận từng bước cụ thể, độc lập giữa 2 Browser Context riêng biệt (Manager Context và Customer Context), đăng nhập bằng tài khoản và token thật từ API Backend (`mana@gmail.com` và `customer.test@example.com`).
- **Nguồn dữ liệu chân lý (Single Source of Truth):** Toàn bộ trạng thái đơn hàng, thanh toán, thông báo được lưu trữ và kiểm soát bởi Backend CSDL MySQL (Prisma ORM). `localStorage` chỉ dùng làm cache giao diện, không can thiệp logic hay ghi đè trạng thái.

---

## 2. KẾT QUẢ THỰC HIỆN CÁC YÊU CẦU ĐỢT REVIEW

### 1. Thứ tự Routes & Bảo mật thông tin đơn hàng (`be/src/routes/order.routes.js` & controller)
- Đưa route `GET /my-orders` và `GET /check-payos/:orderCode` lên **TRƯỚC** `GET /:orderNumber` để tránh bị Express router nuốt nhầm param.
- Đưa route `DELETE /clear-all` lên **TRƯỚC** `DELETE /:id`.
- Tại `GET /:orderNumber`:
  - Khách hàng là chủ sở hữu đơn hoặc tài khoản có role `ADMIN` / `MANAGER` mới nhận được đầy đủ thông tin đơn hàng.
  - Khách vãng lai (không đăng nhập hoặc không phải chủ đơn) sẽ bị **ẩn/che (mask) số điện thoại và địa chỉ nhận hàng** (`recipient_phone` che thành `090123****`, địa chỉ nhận hàng che thành `***`) để đảm bảo an toàn thông tin cá nhân.

### 2. Chuẩn hóa Mapping Trạng thái UI & Bổ sung các trường thời gian
- Cập nhật mapping dữ liệu từ Backend ra UI tại `fe/src/pages/manager/OrderManager.jsx` và `fe/src/pages/ProfilePage.jsx`:
  - `DELIVERED` → `'DELIVERED'` (hiển thị ở tab Đã giao).
  - `COMPLETED` → `'COMPLETED'` (hiển thị ở tab Hoàn thành).
  - `DELIVERY_FAILED` → `'DELIVERY_FAILED'` (hiển thị ở tab Giao thất bại).
  - Truyền đầy đủ các trường thời gian xuống UI: `customer_received_at`, `delivered_at`, `completed_at`, `delivery_attempts`.
- Nút **"Đã nhận được hàng"** phía khách hàng: hiển thị với đơn hàng `DELIVERED` khi khách chưa bấm (`customer_received_at` chưa có).
- Nút **"Hoàn thành"** phía Quản lý: chỉ bấm được khi đơn `DELIVERED` VÀ (khách đã xác nhận nhận hàng HOẶC đã giao quá thời hạn tự động hoàn tất cấu hình qua `ORDER_AUTO_COMPLETE_DAYS`).

### 3. Loại bỏ `.catch(() => {})` và Ngăn chặn cập nhật UI khi API lỗi
- Xóa bỏ toàn bộ các khối `.catch(() => {})` nuốt lỗi khi đổi trạng thái hoặc duyệt/từ chối hoàn tiền tại `OrderManager.jsx` (hàm `handleConfirmRefund`, `handleConfirmRejectWithReason`) và `ProfilePage.jsx` (hàm `confirmRefundOrder`).
- Đã chuyển sang mô hình `await` API: nếu API thất bại, dừng ngay lập tức, hiển thị thông báo lỗi (Toast/Alert) cho người dùng và **KHÔNG** cập nhật giao diện hay ghi vào localStorage.

### 4. Gửi email đơn lẻ chuẩn xác (Single Email Dispatch)
- Mỗi lần đổi trạng thái chỉ gửi **đúng 1 email** duy nhất (ưu tiên `recipient_email` người nhận hàng, nếu không có thì fallback sang email của tài khoản khách hàng).
- Đã loại bỏ logic gửi lặp nhiều người nhận trong Set tại `order.service.js`.

### 5. Migration Prisma: Baseline Migration & Hướng dẫn CSDL hiện hữu
- Tạo migration khởi tạo (baseline) tại `be/prisma/migrations/0_init/migration.sql` chứa toàn bộ cấu trúc bảng ban đầu, giúp lệnh `prisma migrate deploy` chạy thành công trên CSDL trống.
- **Hướng dẫn cho CSDL cũ đang dùng `db push`:**
  Chạy lần lượt 2 lệnh sau để đánh dấu migration đã áp dụng mà không làm gián đoạn hay mất dữ liệu:
  ```bash
  cd be
  npx prisma migrate resolve --applied 0_init
  npx prisma migrate resolve --applied 20261115_add_order_statuses_and_fields
  ```
  Sau khi resolve, kiểm tra lại bằng:
  ```bash
  npx prisma migrate status
  # Kết quả: "Database schema is up to date!"
  ```

### 6. Bổ sung Backend Unit/Integration Tests
- Bổ sung `Scenario 10` trong `be/test/order_flow.test.js`: Kiểm thử `GET /api/orders/my-orders` chỉ trả về đơn của chính khách hàng đăng nhập; từ chối đơn của khách hàng khác; kiểm thử `GET /:orderNumber` che số điện thoại và địa chỉ đối với khách vãng lai.
- Bổ sung `Scenario 11`: Mock `sendOrderNotificationEmail` và kiểm tra số lượng email phát đi chính xác là 1 khi cập nhật trạng thái đơn.
- Chuẩn hóa payload tạo đơn trong toàn bộ file test sử dụng `variant_id` (hỗ trợ fallback tương thích cả `variant_id`, `variantId`, `id`).

---

## 3. CHI TIẾT DANH SÁCH LỖI HỆ THỐNG ĐÃ XỬ LÝ TOÀN DIỆN

### A. Job tự hủy đơn sau 5 phút (`be/src/config/paymentExpiration.job.js`)
- Chỉ tự động hủy đơn có phương thức thanh toán `PAYOS` và `payment_status = 'PENDING'` quá hạn 5 phút. Đơn COD được giữ nguyên ở `PENDING`.
- Khi hủy thực hiện transaction: hoàn tồn kho, hoàn lượt voucher, đổi payment sang `CANCELLED`, ghi `OrderStatusHistory`, tạo bản ghi `Notification` và gửi email cho khách.

### B. Khớp sai đơn và gửi email trùng lặp
- `order.repository.js`: `findOrderByIdOrNumber`, `findOrderAny`, `deleteOrderById` chỉ tìm kiếm chính xác tuyệt đối theo `order_id` hoặc `order_number`.
- `OrderManager.jsx`: chỉ gọi 1 lần `updateOrderStatus` có `await`. Bỏ hoàn toàn việc Frontend gọi API `/orders/notify-email`.

### C. Phân quyền API đơn hàng (RBAC) & Endpoint Khách hàng
- `GET /api/orders`, `PATCH /api/orders/:id/status`, `DELETE /api/orders/:id`, `DELETE /api/orders/clear-all`, `POST /api/orders/notify-email` bắt buộc `authenticateToken` + `authorizeRoles('ADMIN', 'MANAGER')`.
- Các endpoint riêng cho khách hàng:
  - `PATCH /api/orders/customer/:id/cancel`
  - `POST /api/orders/customer/:id/refund-request`
  - `PATCH /api/orders/customer/:id/confirm-delivered`
- `employeeId` được lấy từ decoded JWT token, không lấy từ request body.

### D. Webhook PayOS & Idempotency
- Kiểm tra chữ ký webhook PayOS bắt buộc; từ chối khi sai hoặc thiếu checksum.
- Webhook idempotent: gọi lại không gửi trùng email hay trùng log.
- Khi thanh toán PayOS thành công: `payment_status = 'SUCCESS'`, đơn hàng **vẫn ở `PENDING`** để nhân viên duyệt.

### E. Quản lý Tồn kho & Voucher (Atomic Transactions)
- Thực hiện trong Prisma `$transaction`, có cơ chế chặn hoàn lặp (double-restoration).
- Voucher PayOS chỉ tính đã dùng khi thanh toán thành công.

### F. Chuông Thông báo Web CSDL & Xóa thông báo triệt để
- Triển khai bảng `Notification` trong MySQL với đầy đủ API RESTful (`GET /`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`, `DELETE /`).
- Bổ sung nút Xóa từng thông báo và Xóa tất cả. Bỏ logic tự nạp lại từ localStorage.

### G. Khắc phục lỗi Biến chưa khai báo (ReferenceError)
- Đã khai báo biến `isActuallyApproved`, `isActuallyRejected` trong `ProfilePage.jsx`.
- Đã khai báo `showCategoryMenu` trong `Header.jsx`.
- Bổ sung `showError` vào `useToast()` trong `ProductDetailPage.jsx`.

### H. Nút Yêu cầu Hoàn tiền phía Khách hàng
- Chỉ hiển thị với đơn PayOS đã thanh toán thành công bị Shop hủy. Ẩn đối với đơn COD.

### I. Tìm kiếm tính năng "Tự đọc to khi chỉ chuột để dịch" (Mục 13)
- **Kết luận:** Trong toàn bộ mã nguồn dự án **KHÔNG có bất kỳ code nào đọc to văn bản**.
- Đây là tính năng của trình duyệt (Read Aloud trên Edge/Chrome) hoặc Extension dịch thuật (Google Translate Extension) của máy người dùng.
- **Cách tắt:** Tắt quyền phát âm thanh/đọc văn bản trong tiện ích dịch thuật tại `chrome://extensions/` hoặc `edge://extensions/`.

---

## 4. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

### 4.1. Kết quả chạy Automated Backend Tests (`npm test`)
```
> youthfashion-backend@1.0.0 test
> node --test test/**/*.test.js

▶ Youth Fashion Order Flow & Bug Fix Test Suite
  ✔ Scenario 1: Complete Order Lifecycle 1-9 via API with status history & notifications (235.227ms)
  ✔ Scenario 2: Invalid status transitions return 400 (51.7362ms)
  ✔ Scenario 3: PayOS unpaid expires after 5 mins; COD remains PENDING (39.7073ms)
  ✔ Scenario 4: Exact order matching prevents prefix overlap mutation (28.0714ms)
  ✔ Scenario 5: RBAC - Manager routes require ADMIN/MANAGER role; Customer cannot touch other customer order (22.9138ms)
  ✔ Scenario 6: PayOS Webhook signature verification and idempotency (2.6916ms)
  ✔ Scenario 7: Atomic stock & voucher restoration on cancellation with double-cancel protection (51.781ms)
  ✔ Scenario 8: Auto-complete job transitions expired DELIVERED orders to COMPLETED (18.5342ms)
  ✔ Scenario 9: Notification CRUD - deleted notification is not returned in subsequent queries (20.4497ms)
  ✔ Scenario 10: GET /api/orders/my-orders returns customer orders & GET /:orderNumber masks data for strangers (53.647ms)
  ✔ Scenario 11: Status update triggers EXACTLY 1 email notification (135.9984ms)
✔ Youth Fashion Order Flow & Bug Fix Test Suite (703.8289ms)

ℹ tests 11
ℹ suites 1
ℹ pass 11
ℹ fail 0
```

### 4.2. Danh sách ảnh minh chứng E2E thật (`docs/e2e-screenshots/`)
Toàn bộ ảnh chụp được tạo tự động bởi Playwright runner thật (`e2e_runner.mjs`) trên trình duyệt Chromium thực, tương tác trực tiếp với UI và DB đã seed:

| STT | Tên tệp ảnh | Mô tả hành động & Giao diện ghi nhận |
|:---:|:---|:---|
| 1 | `01_customer_orders_created.png` | Khách hàng đăng nhập, xem đơn hàng COD mới tạo ở tab "Chờ xác nhận" |
| 2 | `02_manager_confirmed.png` | Manager đăng nhập trong browser context riêng, duyệt đơn chuyển sang "Đã xác nhận" |
| 3 | `03_manager_shipping.png` | Manager cập nhật đơn sang "Đang vận chuyển" |
| 4 | `04_manager_delivery_failed.png` | Manager cập nhật giao thất bại, đơn vào tab "Giao thất bại" có nút "Giao lại" |
| 5 | `05_manager_retry_shipping.png` | Manager bấm "Giao lại", số lần thử tăng và đơn quay lại "Đang vận chuyển" |
| 6 | `06_manager_delivered.png` | Manager cập nhật giao thành công, đơn chuyển vào tab "Đã giao" |
| 7 | `07_customer_confirmed_receipt.png` | Khách hàng thấy nút "Đã nhận được hàng" và bấm xác nhận thành công |
| 8 | `08_manager_completed.png` | Manager thấy đơn đã đủ điều kiện nhận hàng, bấm "Hoàn thành" thành công |
| 9 | `09_customer_completed_tab.png` | Khách hàng xem đơn hoàn tất tại tab "Hoàn thành" trong Lịch sử đơn hàng |
| 10 | `10_customer_refund_modal.png` | Đơn PayOS bị shop hủy: khách hàng thấy nút và mở modal "Yêu Cầu Hoàn Tiền" |
| 11 | `11_customer_refund_requested.png` | Khách điền STK gửi yêu cầu hoàn tiền, đơn chuyển sang "Đổi trả" phía Manager |
| 12 | `12_manager_reject_refund.png` | Manager mở popup từ chối hoàn tiền, nhập lý do từ chối |
| 13 | `13_customer_refund_rejected.png` | Khách hàng thấy lý do từ chối hoàn tiền hiển thị trên đơn hàng |
| 14 | `14_customer_notifications.png` | Khách hàng mở trang Thông báo, danh sách thông báo CSDL hiển thị đầy đủ |
| 15 | `15_customer_notifications_cleared.png` | Khách hàng xóa tất cả thông báo, giao diện trống sạch và không nạp lại sau reload |
