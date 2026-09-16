# POST /api/orders

Tạo đơn hàng mới (Hỗ trợ cả Khách hàng đăng nhập và Guest checkout). Tự động thiết lập `payment_deadline` = thời gian hiện tại + 5 phút.

## Auth

🌐 Public (Hỗ trợ Guest Checkout nếu không có Bearer token, hoặc Customer nếu có token).

## Request Body

```json
{
  "customer_name": "Nguyễn Văn A",
  "customer_phone": "0912345678",
  "customer_email": "customer@example.com",
  "shipping_address": "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  "items": [
    {
      "variant_id": 101,
      "quantity": 2
    }
  ]
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| customer_name | string | ✅ | 1-255 ký tự |
| customer_phone | string | ✅ | 10-11 chữ số |
| customer_email | string | ✅ | Định dạng email |
| shipping_address | string | ✅ | Địa chỉ giao hàng đầy đủ |
| items | array | ✅ | Danh sách sản phẩm thanh toán |

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Tạo đơn hàng thành công. Vui lòng thanh toán trong vòng 5 phút.",
  "data": {
    "order_id": 1001,
    "order_code": "ORD-20260915-8821",
    "total_amount": 500000,
    "order_status": "PENDING_PAYMENT",
    "payment_deadline": "2026-09-15T16:45:00.000Z"
  }
}
```
