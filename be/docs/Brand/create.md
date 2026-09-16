# POST /api/brands

Tạo thương hiệu mới.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Request Body

```json
{
  "name": "UrbanStyle",
  "description": "Thương hiệu đường phố",
  "logo_url": "https://.../brand_logo.png"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| name | string | ✅ | 1-100 ký tự, unique |
| description | string | ❌ | Mô tả |
| logo_url | string | ❌ | URL logo |

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Tạo thương hiệu mới thành công",
  "data": { "brand_id": 3, "name": "UrbanStyle" }
}
```
