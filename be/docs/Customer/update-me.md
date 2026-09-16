# PATCH /api/customers/me

Cập nhật thông tin cá nhân của Khách hàng đang đăng nhập.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Request Body

```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0987654321",
  "avatar_url": "https://res.cloudinary.com/demo/image/upload/v1/new_avatar.jpg"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| full_name | string | ❌ | 1-255 ký tự |
| phone | string | ❌ | 10-11 chữ số |
| avatar_url | string | ❌ | URL ảnh đại diện hợp lệ |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật thông tin cá nhân thành công",
  "data": {
    "customer_id": 1,
    "email": "customer@example.com",
    "full_name": "Nguyễn Văn B",
    "phone": "0987654321",
    "avatar_url": "https://res.cloudinary.com/demo/image/upload/v1/new_avatar.jpg"
  }
}
```
