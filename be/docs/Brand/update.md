# PUT /api/brands/:brand_id

Cập nhật thương hiệu.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật thương hiệu thành công"
}
```
