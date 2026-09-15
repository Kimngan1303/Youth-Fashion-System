# PUT /api/products/:product_id

Cập nhật thông tin sản phẩm, hình ảnh và biến thể.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Request Body

```json
{
  "name": "Áo Hoodie Fleece Unisex (Cập nhật)",
  "category_id": 1,
  "brand_id": 2,
  "description": "Mô tả mới...",
  "is_active": true
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | ❌ | 1-255 ký tự |
| category_id | number | ❌ | ID danh mục hợp lệ |
| brand_id | number | ❌ | ID thương hiệu hợp lệ |
| description | string | ❌ | Mô tả chi tiết |
| is_active | boolean | ❌ | Trạng thái hiển thị sản phẩm |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật sản phẩm thành công"
}
```
