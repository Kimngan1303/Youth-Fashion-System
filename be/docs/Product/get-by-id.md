# GET /api/products/:product_id

Xem chi tiết sản phẩm bao gồm danh sách hình ảnh và danh sách biến thể (màu sắc, kích thước, giá, số lượng tồn kho).

## Auth

🌐 Public.

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "product_id": 1,
    "name": "Áo Thun Cotton Oversize",
    "slug": "ao-thun-cotton-oversize",
    "description": "Áo thun phong cách trẻ trung, chất liệu 100% cotton thoáng mát.",
    "category": { "category_id": 1, "name": "Áo Nam" },
    "brand": { "brand_id": 2, "name": "YouthStyle" },
    "images": [
      { "image_id": 10, "image_url": "https://.../img1.jpg", "is_primary": true }
    ],
    "variants": [
      {
        "variant_id": 101,
        "sku": "AT-COTTON-DEN-M",
        "color": "Đen",
        "size": "M",
        "price": 250000,
        "stock_qty": 50,
        "status": "IN_STOCK"
      }
    ]
  }
}
```
