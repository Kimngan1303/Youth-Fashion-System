# POST /api/orders/:order_id/payments

Tạo đợt thanh toán PayOS mới cho đơn hàng (Hỗ trợ thử lại thanh toán retry khi giao dịch cũ bị thất bại và chưa quá hạn 5 phút).

## Auth

🌐 Public (Dành cho người tạo đơn hàng).

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Tạo đường link thanh toán thành công",
  "data": {
    "payment_id": 50,
    "order_id": 1001,
    "payment_url": "https://pay.payos.vn/web/v2/checkout/...",
    "amount": 500000,
    "payment_status": "PENDING"
  }
}
```

### 422 Unprocessable Entity / 400 Bad Request

```json
{
  "status": false,
  "message": "Đơn hàng đã hết hạn 5 phút thanh toán"
}
```
