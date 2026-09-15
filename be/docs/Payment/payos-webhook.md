# POST /api/payments/payos/webhook

Webhook tiếp nhận kết quả thanh toán tự động từ hệ thống PayOS. Yêu cầu kiểm tra chữ ký checksum signature trước khi xử lý transaction.

## Auth

🌐 Public (Xác thực bằng PayOS Webhook Signature).

## Request Body

```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "orderCode": 123456,
    "amount": 500000,
    "description": "Thanh toan don hang ORD-1001",
    "accountNumber": "123456789",
    "reference": "FT23123456",
    "transactionDateTime": "2026-09-15 16:42:00",
    "paymentLinkId": "link_123"
  },
  "signature": "c5f40078..."
}
```

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Webhook processed successfully"
}
```
