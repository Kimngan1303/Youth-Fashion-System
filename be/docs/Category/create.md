# POST /api/categories

Tạo danh mục sản phẩm mới.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Request Body

```json
{
  "name": "Quần Jeans",
  "description": "Quần jeans nam nữ thời trang"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | ✅ | 1-100 ký tự, unique |
| description | string | ❌ | Mô tả chi tiết |

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Tạo danh mục mới thành công",
  "data": { "category_id": 5, "name": "Quần Jeans", "slug": "quan-jeans" }
}
```
