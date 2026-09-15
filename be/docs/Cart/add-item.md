# POST /api/cart/items

Thêm sản phẩm biến thể vào giỏ hàng. Nếu sản phẩm đã có trong giỏ, số lượng sẽ được cộng dồn.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Request Body

```json
{
  "variant_id": 101,
  "quantity": 1
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| variant_id | number | ✅ | ID biến thể sản phẩm |
| quantity | number | ✅ | Số lượng lớn hơn 0 |

## Response

### 201 Created / 200 OK

```json
{
  "status": true,
  "message": "Đã thêm sản phẩm vào giỏ hàng"
}
```
