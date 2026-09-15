# POST /api/auth/register

Đăng ký tài khoản Khách hàng (Customer) mới. Mật khẩu sẽ được hash bằng bcrypt trước khi lưu vào CSDL.

## Auth

🌐 Public (Không yêu cầu token).

## Request Body

```json
{
  "email": "customer@example.com",
  "password": "Password123!",
  "full_name": "Nguyễn Văn A",
  "phone": "0912345678"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| email | string | ✅ | Định dạng email hợp lệ, unique, tối đa 255 ký tự |
| password | string | ✅ | 8-100 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số |
| full_name | string | ✅ | 1-255 ký tự |
| phone | string | ❌ | Định dạng số điện thoại Việt Nam (10-11 chữ số) |

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực.",
  "data": {
    "customer_id": 1,
    "email": "customer@example.com",
    "full_name": "Nguyễn Văn A",
    "is_verified": false
  }
}
```

### 400 Bad Request / Validation Failed

```json
{
  "status": false,
  "message": "Validation failed",
  "errors": [
    "Email đã tồn tại trong hệ thống",
    "Mật khẩu phải chứa ít nhất 8 ký tự"
  ]
}
```
