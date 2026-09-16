# GET /api/cart

Lấy thông tin giỏ hàng của Khách hàng đang đăng nhập. (Đối với Guest, giỏ hàng lưu tại localStorage của Frontend).

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "cart_id": 1,
    "items": [
      {
        "cart_item_id": 10,
        "variant_id": 101,
        "product_name": "Áo Thun Cotton Oversize",
        "color": "Đen",
        "size": "M",
        "price": 250000,
        "quantity": 2,
        "subtotal": 500000
      }
    ],
    "total_amount": 500000
  }
}
```
