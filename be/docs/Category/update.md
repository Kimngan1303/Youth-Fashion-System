# PUT /api/categories/:category_id

Cập nhật danh mục sản phẩm.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Request Body

```json
{
  "name": "Quần Jeans Denim",
  "description": "Quần jeans chất liệu denim cao cấp"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | ❌ | 1-100 ký tự |
| description | string | ❌ | Mô tả chi tiết |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật danh mục thành công"
}
```
