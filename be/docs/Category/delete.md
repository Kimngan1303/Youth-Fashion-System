# DELETE /api/categories/:category_id

Xóa danh mục sản phẩm.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Xóa danh mục thành công"
}
```
