# POST /api/orders/:order_id/cancel

Hủy đơn hàng chưa thanh toán.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER` \| `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Đã hủy đơn hàng thành công"
}
```
