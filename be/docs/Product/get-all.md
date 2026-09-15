# GET /api/products

Lấy danh sách sản phẩm có phân trang, lọc theo danh mục, thương hiệu, khoảng giá và sắp xếp.

## Auth

🌐 Public (Khách truy cập và Khách hàng đều gọi được).

## Query Parameters

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| page | number | ❌ | Mặc định `1` |
| limit | number | ❌ | Mặc định `12`, tối đa `50` |
| category_id | number | ❌ | ID danh mục |
| brand_id | number | ❌ | ID thương hiệu |
| min_price | number | ❌ | Giá tối thiểu |
| max_price | number | ❌ | Giá tối đa |
| sort | string | ❌ | `newest` \| `price_asc` \| `price_desc` |

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "product_id": 1,
        "name": "Áo Thun Cotton Oversize",
        "slug": "ao-thun-cotton-oversize",
        "category_name": "Áo Nam",
        "brand_name": "YouthFashion",
        "primary_image": "https://res.cloudinary.com/demo/image/upload/v1/shirt1.jpg",
        "min_price": 250000,
        "max_price": 290000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total_items": 45,
      "total_pages": 4
    }
  }
}
```
