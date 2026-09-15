# DELETE /api/brands/:brand_id

Xóa thương hiệu.

## Auth

🔒 Yêu cầu Bearer Token (Role: `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Xóa thương hiệu thành công"
}
```
