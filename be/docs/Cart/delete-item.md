# DELETE /api/cart/items/:cart_item_id

Xóa sản phẩm khỏi giỏ hàng.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Đã xóa sản phẩm khỏi giỏ hàng"
}
```
