# QUY TẮC & QUY TRÌNH GIT DÀNH RIÊNG CHO NHÁNH `nganttk`
> **Tài liệu chuẩn mực bắt buộc tuân thủ (Mandatory Rules for AI Agent & Developer `nganttk`)**  
> Mọi thao tác pull code, push code và merge vào nhánh `main` trong dự án **Youth Fashion** của nhánh **`nganttk`** đều phải tuân thủ nghiêm ngặt theo các bước dưới đây.

---

## I. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Nhánh làm việc chính thức:**
   - Mọi mã nguồn phát triển bởi bạn/AI Agent đều thực hiện trên nhánh: **`nganttk`**.
   - Tuyệt đối **KHÔNG** code hoặc commit trực tiếp trên nhánh `main`.
   - Tuyệt đối **KHÔNG** dùng lệnh `git push --force` (`-f`) lên nhánh `main`.
2. **Cam kết dữ liệu sạch:**
   - Không bao giờ commit file biến môi trường (`.env`), thư mục phụ thuộc (`node_modules/`, `dist/`, `build/`) hoặc file rác hệ thống.
3. **Quy chuẩn Commit Message (Conventional Commits):**
   - `feat: <mô tả ngắn>`: Thêm chức năng mới (VD: `feat(auth): create register page and connect routes`)
   - `fix: <mô tả ngắn>`: Sửa lỗi (VD: `fix(auth): fix password confirmation check`)
   - `style: <mô tả ngắn>`: Thay đổi giao diện, căn chỉnh CSS
   - `refactor: <mô tả ngắn>`: Tái cấu trúc mã nguồn
   - `docs: <mô tả ngắn>`: Cập nhật tài liệu
   - `chore: <mô tả ngắn>`: Cập nhật cấu hình, package dependencies

---

## II. THIẾT LẬP BAN ĐẦU (NẾU CHƯA KHỞI TẠO GIT HOẶC CHƯA CÓ NHÁNH)

Nếu thư mục dự án vừa giải nén chưa có Git hoặc chưa liên kết với GitHub:

```bash
# 1. Khởi tạo git (nếu chưa có)
git init

# 2. Liên kết đến repository GitHub của dự án
git remote add origin <LINK_GITHUB_REPO_CUA_BAN>

# 3. Tạo và chuyển sang nhánh nganttk
git checkout -b nganttk
```

---

## III. QUY TRÌNH PULL CODE VỀ MÁY CHO NHÁNH `nganttk`

Trước khi bắt đầu làm việc hoặc trước khi đẩy code lên, luôn đồng bộ code mới nhất từ `main` và từ remote nhánh `nganttk` về máy.

### Bước 1: Kiểm tra trạng thái hiện tại
```bash
git status
```
- Nếu đang có code dang dở chưa commit, lưu tạm bằng stash:
  ```bash
  git stash
  ```

### Bước 2: Đảm bảo đang ở nhánh `nganttk`
```bash
git checkout nganttk
```

### Bước 3: Kéo code mới nhất về nhánh `nganttk`
1. **Kéo code mới của nhánh `nganttk` từ remote về:**
   ```bash
   git pull origin nganttk
   ```
2. **Đồng bộ các cập nhật mới nhất từ nhánh `main` vào `nganttk`:**
   ```bash
   git pull origin main
   ```
   *(Thao tác này giúp giải quyết xung đột sớm ngay tại local trước khi push).*

3. Nếu ở Bước 1 có dùng `git stash`, khôi phục lại code dang dở:
   ```bash
   git stash pop
   ```

---

## IV. QUY TRÌNH ĐẨY CODE LÊN (PUSH CODE TỪ NHÁNH `nganttk`)

### Bước 1: Kiểm tra chất lượng và build thử trước khi commit
Trước khi commit, bắt buộc kiểm tra xem code có bị lỗi cú pháp hay lỗi build hay không:
- Tại thư mục `fe`:
  ```bash
  npm run build
  ```
  *(Chỉ tiến hành commit khi lệnh build thành công).*

### Bước 2: Kiểm tra các file đã thay đổi
```bash
git status
git diff
```
Đảm bảo chỉ commit các file mã nguồn liên quan, không sót file cấu hình nhạy cảm.

### Bước 3: Đưa file vào Staging và Commit
```bash
# Thêm toàn bộ các thay đổi hợp lệ
git add .

# Tạo commit đúng chuẩn Conventional Commits
git commit -m "feat(auth): complete register page matching design and update routes"
```

### Bước 4: Kéo code lần cuối để tránh xung đột
```bash
git pull origin nganttk
```

### Bước 5: Đẩy code từ nhánh `nganttk` lên Remote GitHub
```bash
# Đẩy lên nhánh nganttk trên GitHub
git push origin nganttk

# (Hoặc nếu là lần push đầu tiên của nhánh):
git push -u origin nganttk
```

---

## V. QUY TRÌNH MERGE TỪ NHÁNH `nganttk` VÀO `main`

Khi toàn bộ tính năng trên nhánh `nganttk` đã hoàn tất, kiểm thử mượt mà và sẵn sàng đưa vào bản chính thức:

### Cách 1: Tạo Pull Request trên GitHub (Khuyên dùng khi làm việc nhóm)
1. Mở GitHub Repository của dự án trên trình duyệt.
2. Vào tab **Pull requests** -> Bấm **New pull request**.
3. Chọn:
   - **base:** `main`
   - **compare:** `nganttk`
4. Tiêu đề PR: `[Feature/Update] Tóm tắt tính năng của nhánh nganttk`
5. Nội dung mô tả PR:
   - Các file và tính năng đã thêm/sửa (ví dụ: Trang Register, liên kết Login, responsive).
   - Xác nhận đã test local chạy mượt, build pass.
6. Nhấn **Create pull request**.
7. Sau khi review xong, chọn **Squash and merge** hoặc **Merge pull request**.

---

### Cách 2: Merge trực tiếp an toàn bằng Git CLI (Dành cho AI Agent / Team Lead)

Khi được yêu cầu thực hiện merge nhánh `nganttk` vào `main` thông qua dòng lệnh:

#### Bước 1: Đảm bảo nhánh `nganttk` đã commit sạch sẽ
```bash
git checkout nganttk
git status
# Đảm bảo hiển thị: "nothing to commit, working tree clean"
```

#### Bước 2: Chuyển sang nhánh `main` và cập nhật bản mới nhất
```bash
git checkout main
git pull origin main
```

#### Bước 3: Thực hiện merge nhánh `nganttk` vào `main`
```bash
git merge nganttk --no-ff -m "merge: integrate branch nganttk into main"
```
*(Cờ `--no-ff` giúp tạo commit merge rõ ràng trong lịch sử Git).*

#### Bước 4: Xử lý xung đột (Merge Conflict) - Nếu xảy ra
Nếu Git báo xung đột (Conflict):
1. Chạy `git status` để xem danh sách file bị xung đột.
2. Mở file, chọn giữ code chính xác giữa `<<<<<<< HEAD` (nhánh `main`) và `>>>>>>> nganttk`.
3. Lưu file và đánh dấu đã xử lý:
   ```bash
   git add <ten-file-da-sua>
   ```
4. Hoàn tất commit merge:
   ```bash
   git commit -m "fix(merge): resolve conflicts between main and nganttk"
   ```

#### Bước 5: Kiểm tra xác thực sau Merge
Chạy lại lệnh build trên nhánh `main`:
```bash
npm run build
```

#### Bước 6: Đẩy nhánh `main` đã merge lên Remote
```bash
git push origin main
```

#### Bước 7: Quay trở lại nhánh `nganttk` để tiếp tục công việc
```bash
git checkout nganttk
git merge main
```

---

## VI. NGUYÊN TẮC BẮT BUỘC DÀNH CHO AI AGENT KHI LÀM VIỆC VỚI NHÁNH `nganttk`

Khi AI Agent thao tác với dự án này, **PHẢI** tuân thủ các bước:

1. **Khảo sát nhánh:** Luôn kiểm tra `git status` và `git branch`. Đảm bảo nhánh làm việc luôn là **`nganttk`**.
2. **Không commit trực tiếp vào `main`:** Mọi tính năng, fix bug đều commit trên nhánh `nganttk`.
3. **Kiểm tra trước khi commit:** Luôn kiểm tra build hoặc cú pháp trước khi chạy `git commit`.
4. **Viết commit đúng chuẩn:** Dùng định dạng `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`.
5. **Đẩy code an toàn:** Sử dụng đúng lệnh `git push origin nganttk`.
