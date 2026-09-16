# PATCH /api/admin/employees/:employee_id/status

Bật / Tắt trạng thái hoạt động của nhân viên.

## Auth

🔒 Yêu cầu Bearer Token (Role: `ADMIN`).

## Request Body

```json
{
  "is_active": false
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| is_active | boolean | ✅ | `true` (kích hoạt) hoặc `false` (khóa tài khoản) |

## Response

### 200 OK

```json
{
  "status": true,
  "message": "Cập nhật trạng thái nhân viên thành công"
}
```
