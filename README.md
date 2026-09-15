# Youth Fashion - Website Thời Trang Cho Giới Trẻ Tích Hợp AI

> **Đề tài:** Nền tảng thương mại điện tử thời trang tích hợp module AI tìm kiếm bằng hình ảnh kết hợp ngữ nghĩa (Semantic Image Search), thanh toán trực tuyến PayOS, lưu trữ đám mây Cloudinary và xác thực tài khoản Google Mail.

🔗 **GitHub Repository:** [https://github.com/Kimngan1303/Youth-Fashion-System.git](https://github.com/Kimngan1303/Youth-Fashion-System.git)

---

## 1. Cấu Trúc Dự Án (Project Architecture)

```text
YouthFashion/
├── backend/                  # Mã nguồn BackEnd (Node.js, Express.js, MySQL RESTful API)
│   ├── src/
│   │   ├── config/           # Cấu hình CSDL MySQL (db.js tự động khởi tạo 13 bảng theo ERD)
│   │   └── test-db.js        # Script kiểm tra kết nối CSDL
│   ├── schema.sql            # File DDL SQL 13 bảng theo đúng chuẩn ERD
│   ├── .env.example          # Mẫu cấu hình môi trường
│   └── package.json
│
├── frontend/                 # Mã nguồn FrontEnd (ReactJS, Vite, Vanilla CSS Design System)
│   ├── src/
│   │   ├── components/       # Component giao diện (Logo.jsx, AISearchModal.jsx...)
│   │   ├── App.jsx           # Trang chủ Homepage với 13 Prompt Tiếng Việt chi tiết
│   │   ├── index.css         # Design system, Typography Serif cao cấp & Marquee
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── start-dev.bat             # File chạy nhanh đồng thời Frontend & Backend cho Windows
├── .gitignore                # Bỏ qua node_modules và .env bảo mật
└── README.md                 # Hướng dẫn chi tiết cho cả nhóm
```

---

## 2. Hướng Dẫn Cài Đặt Cho Thành Viên Nhóm

### Bước 1: Clone dự án về máy
```bash
git clone https://github.com/Kimngan1303/Youth-Fashion-System.git
cd Youth-Fashion-System
```

### Bước 2: Cài đặt Dependencies cho FrontEnd & BackEnd
```bash
# Cài đặt cho Backend
cd backend
npm install

# Cài đặt cho Frontend
cd ../frontend
npm install
```

### Bước 3: Cấu hình Cơ sở dữ liệu MySQL
1. Bật dịch vụ **MySQL Server** (qua MySQL Workbench, XAMPP, Laragon hoặc Docker).
2. Tạo file `backend/.env` từ file `backend/.env.example`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mật_khẩu_mysql_của_bạn
DB_NAME=youthfashion_db
DB_PORT=3306

JWT_SECRET=youthfashion_super_secret_jwt_key_2026_modern
```
3. Khởi tạo và kiểm tra CSDL:
```bash
cd backend
node src/test-db.js
```
*(Hệ thống sẽ tự động tạo cơ sở dữ liệu `youthfashion_db`, 13 bảng theo đúng sơ đồ ERD và nạp dữ liệu mẫu ban đầu).*

---

## 3. Chạy Dự Án Trong Quá Trình Phát Triển (Run Development)

- **Cách 1: Nhấp đúp vào file `start-dev.bat`** ở thư mục gốc để mở đồng thời cả Frontend và Backend.
- **Cách 2: Chạy thủ công qua dòng lệnh**:
  - Chạy Backend:
    ```bash
    cd backend
    npm start
    ```
  - Chạy Frontend (React Vite):
    ```bash
    cd frontend
    npm run dev
    ```
    👉 Truy cập trang chủ tại: **http://localhost:5173/**

---

## 4. Quy Trình Đẩy Code Lên GitHub (Git Workflow)

Mỗi khi thành viên làm xong tính năng hoặc sửa code:
```bash
# 1. Kiểm tra trạng thái các file thay đổi
git status

# 2. Thêm tất cả thay đổi
git add .

# 3. Tạo commit với nội dung rõ ràng
git commit -m "feat: cập nhật giao diện homepage hoặc tính năng mới"

# 4. Kéo code mới nhất từ nhánh main về để tránh xung đột
git pull origin main

# 5. Đẩy code lên GitHub
git push origin main
```

---

## 5. Danh Sách 13 Bảng CSDL Chuẩn ERD
1. `ROLE`: Bảng phân quyền người dùng.
2. `USER`: Quản lý tài khoản người dùng và phân quyền.
3. `CATEGORY`: Danh mục sản phẩm thời trang.
4. `BRAND`: Thương hiệu thời trang độc quyền.
5. `PRODUCT`: Thông tin sản phẩm.
6. `PRODUCT_IMAGE`: Danh sách ảnh sản phẩm (ảnh chính và ảnh phụ).
7. `PRODUCT_VARIANT`: Biến thể SKU, màu sắc, kích cỡ (S, M, L, XL), đơn giá, tồn kho.
8. `CART`: Giỏ hàng người dùng.
9. `CART_ITEM`: Chi tiết các món đồ trong giỏ hàng.
10. `ORDERS`: Đơn đặt hàng của khách.
11. `ORDER_ITEM`: Chi tiết các món trong đơn đặt hàng.
12. `PAYMENT`: Giao dịch thanh toán (PayOS, COD).
13. `AI_SEARCH_CONFIG`: Cấu hình module tìm kiếm AI.
