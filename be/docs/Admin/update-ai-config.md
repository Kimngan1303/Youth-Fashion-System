# PATCH /api/admin/ai-config

Cập nhật trọng số & tham số cấu hình AI Search (Chỉ áp dụng cho Admin).

## Auth

🔒 Yêu cầu Bearer Token (Role: `ADMIN`).

## Request Body

```json
{
  "image_weight": 0.7,
  "text_weight": 0.3,
  "top_k": 25,
  "similarity_threshold": 0.55
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| image_weight | number | ❌ | Trọng số ảnh (0.0 đến 1.0) |
| text_weight | number | ❌ | Trọng số văn bản (0.0 đến 1.0) |
| top_k | number | ❌ | Số lượng sản phẩm kết quả tối đa |
| similarity_threshold | number | ❌ | Ngưỡng tương đồng tối thiểu (0.0 đến 1.0) |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật cấu hình AI Search thành công",
  "data": {
    "image_weight": 0.7,
    "text_weight": 0.3,
    "top_k": 25,
    "similarity_threshold": 0.55
  }
}
```
