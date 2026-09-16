# POST /api/products

Tạo sản phẩm mới cùng các biến thể và hình ảnh.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Request Body

```json
{
  "category_id": 1,
  "brand_id": 2,
  "name": "Áo Hoodie Fleece Unisex",
  "description": "Áo hoodie nỉ giữ ấm cao cấp.",
  "images": [
    { "image_url": "https://.../hoodie1.jpg", "is_primary": true }
  ],
  "variants": [
    {
      "sku": "HD-FLEECE-XAM-L",
      "color": "Xám",
      "size": "L",
      "price": 450000,
      "stock_qty": 30
    }
  ]
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| category_id | number | ✅ | ID danh mục hợp lệ |
| brand_id | number | ✅ | ID thương hiệu hợp lệ |
| name | string | ✅ | 1-255 ký tự |
| description | string | ❌ | Mô tả sản phẩm |
| images | array | ✅ | Danh sách hình ảnh |
| variants | array | ✅ | Danh sách biến thể (SKU unique, price > 0, stock >= 0) |

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Tạo sản phẩm mới thành công",
  "data": { "product_id": 15, "name": "Áo Hoodie Fleece Unisex" }
}
```
