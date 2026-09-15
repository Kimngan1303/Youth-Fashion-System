# GET /api/admin/ai-config

Lấy thông tin cấu hình trọng số & độ tương đồng cho tính năng AI Search (Singleton config_id = 1).

## Auth

🔒 Yêu cầu Bearer Token (Role: `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "config_id": 1,
    "image_weight": 0.6,
    "text_weight": 0.4,
    "top_k": 20,
    "similarity_threshold": 0.5,
    "updated_at": "2026-09-15T16:00:00.000Z"
  }
}
```
