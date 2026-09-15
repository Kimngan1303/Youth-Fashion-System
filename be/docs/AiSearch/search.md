# POST /api/ai-search

Tìm kiếm sản phẩm thông minh bằng mô hình AI FashionCLIP và Vector Database Qdrant. Hỗ trợ 3 chế độ: Văn bản (Text), Hình ảnh (Image), hoặc Kết hợp Hình ảnh + Văn bản (Multimodal).

## Auth

🌐 Public (Khách và Khách hàng).

## Request Format

`multipart/form-data`

## Form Fields

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| query | string | ❌ | Từ khóa tìm kiếm bằng tiếng Việt (Yêu cầu ít nhất 1 trong 2: `query` hoặc `image`) |
| image | file | ❌ | File hình ảnh sản phẩm (JPEG, PNG, WEBP, max 5MB) |
| top_k | number | ❌ | Số lượng sản phẩm kết quả tối đa (Mặc định `20`) |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Tìm kiếm AI thành công",
  "data": [
    {
      "product_id": 1,
      "name": "Áo Thun Oversize Đen Kẻ Sọc",
      "primary_image": "https://.../img.jpg",
      "similarity_score": 0.89,
      "is_alternative": false,
      "min_price": 250000
    },
    {
      "product_id": 5,
      "name": "Áo Polo Nam Xám Ghi",
      "primary_image": "https://.../img2.jpg",
      "similarity_score": 0.62,
      "is_alternative": true,
      "min_price": 280000
    }
  ]
}
```
