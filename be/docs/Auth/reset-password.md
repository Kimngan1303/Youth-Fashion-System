# POST /api/auth/reset-password

Đặt lại mật khẩu mới bằng token đặt lại mật khẩu.

## Auth

🌐 Public (Không yêu cầu token).

## Request Body

```json
{
  "token": "reset_token_here",
  "new_password": "NewPassword123!"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| token | string | ✅ | Reset Token nhận từ email |
| new_password | string | ✅ | 8-100 ký tự, chứa chữ hoa, chữ thường và số |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."
}
```
