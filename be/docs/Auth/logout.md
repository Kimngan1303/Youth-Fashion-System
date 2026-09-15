# POST /api/auth/logout

Đăng xuất tài khoản, xóa Refresh Token khỏi CSDL và xoá HTTP-Only Cookie.

## Auth

🔒 Yêu cầu Access Token (Header Authorization) hoặc Cookie.

## Request Body

*(Không có Request Body)*

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Đăng xuất thành công"
}
```
