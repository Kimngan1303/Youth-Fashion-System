# POST /api/auth/verify-email

Xác thực địa chỉ email tài khoản khách hàng thông qua mã xác thực (token) gửi qua email.

## Auth

🌐 Public (Không yêu cầu token).

## Request Body

```json
{
  "token": "a1b2c3d4e5f67890"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| token | string | ✅ | Mã token nhận được từ email |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Xác thực email thành công"
}
```
