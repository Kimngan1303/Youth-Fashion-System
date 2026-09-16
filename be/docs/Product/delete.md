# DELETE /api/products/:product_id

Xóa sản phẩm (hoặc ngưng hoạt động sản phẩm).

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Xóa sản phẩm thành công"
}
```
