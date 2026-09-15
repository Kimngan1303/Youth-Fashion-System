# GET /api/orders

Lấy danh sách đơn hàng. (Customer lấy lịch sử mua của mình; Manager/Admin xem tất cả đơn hàng).

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER` \| `MANAGER` \| `ADMIN`).

## Query Parameters

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| status | string | ❌ | `PENDING_PAYMENT` \| `PAID` \| `CANCELLED` \| `COMPLETED` |
| page | number | ❌ | Phân trang |
| limit | number | ❌ | Số lượng hiển thị |

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "order_id": 1001,
        "order_code": "ORD-20260915-8821",
        "customer_name": "Nguyễn Văn A",
        "total_amount": 500000,
        "order_status": "PAID",
        "created_at": "2026-09-15T16:00:00.000Z"
      }
    ]
  }
}
```
