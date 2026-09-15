# GET /api/categories

Lấy danh sách tất cả các danh mục sản phẩm (T-shirt, Pants, Hoodies...).

## Auth

🌐 Public.

## Response

### 200 OK

```json
{
  "status": true,
  "data": [
    {
      "category_id": 1,
      "name": "Áo Nam",
      "slug": "ao-nam",
      "description": "Các loại áo thời trang nam"
    }
  ]
}
```
