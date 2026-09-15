# POST /api/auth/login

Đăng nhập vào hệ thống cho Khách hàng (Customer) hoặc Nhân viên (Employee/Manager/Admin). Trả về JWT Access Token và lưu Refresh Token vào HTTP-Only Cookie.

## Auth

🌐 Public (Không yêu cầu token).

## Request Body

```json
{
  "email": "customer@example.com",
  "password": "Password123!",
  "user_type": "CUSTOMER"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| email | string | ✅ | Định dạng email hợp lệ |
| password | string | ✅ | Mật khẩu tài khoản |
| user_type | string | ✅ | `CUSTOMER` \| `EMPLOYEE` |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "CUSTOMER"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "status": false,
  "message": "Email hoặc mật khẩu không chính xác"
}
```
