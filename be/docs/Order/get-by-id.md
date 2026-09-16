# GET /api/orders/:order_id

Xem chi tiết đơn hàng bao gồm danh sách mặt hàng snapshot và lịch sử thanh toán.

## Auth

🔒 Yêu cầu Bearer Token (hoặc Order Token đối với Guest).

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "order_id": 1001,
    "order_code": "ORD-20260915-8821",
    "customer_name": "Nguyễn Văn A",
    "customer_phone": "0912345678",
    "shipping_address": "123 Đường Nguyễn Huệ, Q1, TP.HCM",
    "total_amount": 500000,
    "payment_deadline": "2026-09-15T16:45:00.000Z",
    "order_status": "PENDING_PAYMENT",
    "items": [
      {
        "order_item_id": 1,
        "product_name": "Áo Thun Cotton Oversize",
        "color": "Đen",
        "size": "M",
        "unit_price": 250000,
        "quantity": 2,
        "subtotal": 500000
      }
    ]
  }
}
```
