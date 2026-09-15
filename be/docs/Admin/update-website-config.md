# PATCH /api/admin/website-config

Cập nhật thông tin website (Tên web, hotline, email, địa chỉ).

## Auth

🔒 Yêu cầu Bearer Token (Role: `ADMIN`).

## Request Body

```json
{
  "site_name": "YouthFashion Store",
  "contact_email": "support@youthfashion.vn",
  "contact_phone": "0988888888",
  "address": "456 Đường Lê Lợi, Quận 1, TP.HCM"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| site_name | string | ❌ | Tên cửa hàng |
| contact_email | string | ❌ | Email liên hệ |
| contact_phone | string | ❌ | Số điện thoại hỗ trợ |
| address | string | ❌ | Địa chỉ cửa hàng |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật thông tin website thành công"
}
```
