# POST /api/auth/refresh

Cấp lại Access Token mới khi Access Token cũ hết hạn bằng Refresh Token lưu trong Cookie.

## Auth

🔒 Đọc Refresh Token từ HTTP-Only Cookie (`refreshToken`).

## Request Body

*(Không có Request Body - Đọc tự động từ Cookie)*

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cấp Access Token thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 401 Unauthorized

```json
{
  "status": false,
  "message": "Refresh token không hợp lệ hoặc đã hết hạn"
}
```
