# GET /api/reports/statistics

Lấy thống kê doanh thu, tổng số đơn hàng, khách hàng mới và danh sách sản phẩm bán chạy.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Query Parameters

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| start_date | string | ❌ | Định dạng YYYY-MM-DD |
| end_date | string | ❌ | Định dạng YYYY-MM-DD |

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "total_revenue": 150000000,
    "total_orders": 320,
    "paid_orders": 300,
    "cancelled_orders": 20,
    "new_customers": 45,
    "top_selling_products": [
      {
        "product_id": 1,
        "name": "Áo Thun Cotton Oversize",
        "sold_quantity": 120,
        "revenue": 30000000
      }
    ]
  }
}
```
