# GET /api/customers/me

Lấy thông tin cá nhân của Khách hàng đang đăng nhập.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Request Body

*(Không có Request Body)*

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "customer_id": 1,
    "email": "customer@example.com",
    "full_name": "Nguyễn Văn A",
    "phone": "0912345678",
    "avatar_url": "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
    "is_verified": true
  }
}
```
