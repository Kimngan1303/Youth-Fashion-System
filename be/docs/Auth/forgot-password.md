# POST /api/auth/forgot-password

Gửi yêu cầu đặt lại mật khẩu tới email người dùng.

## Auth

🌐 Public (Không yêu cầu token).

## Request Body

```json
{
  "email": "customer@example.com"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| email | string | ✅ | Email đã đăng ký trong hệ thống |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Hướng dẫn đặt lại mật khẩu đã được gửi vào email của bạn"
}
```
