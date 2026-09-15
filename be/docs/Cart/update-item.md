# PATCH /api/cart/items/:cart_item_id

Cập nhật số lượng sản phẩm trong giỏ hàng.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Request Body

```json
{
  "quantity": 3
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| quantity | number | ✅ | Số lượng lớn hơn 0 |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật số lượng thành công"
}
```
