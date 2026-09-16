# GET /api/admin/website-config

Lấy cấu hình chung của website (Singleton config_id = 1).

## Auth

🌐 Public (hoặc Admin).

## Response

### 200 OK

```json
{
  "status": true,
  "data": {
    "site_name": "YouthFashion",
    "contact_email": "contact@youthfashion.com",
    "contact_phone": "0123456789",
    "address": "123 Đường Fashion, Quận 1, TP.HCM"
  }
}
```
