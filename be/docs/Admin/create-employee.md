# POST /api/admin/employees

Tạo tài khoản nhân viên mới (Manager hoặc Admin).

## Auth

🔒 Yêu cầu Bearer Token (Role: `ADMIN`).

## Request Body

```json
{
  "email": "manager02@youthfashion.com",
  "password": "Password123!",
  "full_name": "Lê Văn C",
  "phone": "0987654321",
  "role": "MANAGER"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| email | string | ✅ | Email unique |
| password | string | ✅ | Mật khẩu hợp lệ |
| full_name | string | ✅ | 1-255 ký tự |
| phone | string | ❌ | Số điện thoại |
| role | string | ✅ | `MANAGER` \| `ADMIN` |

## Response

### 201 Created

```json
{
  "status": true,
  "message": "Tạo nhân viên mới thành công",
  "data": { "employee_id": 2, "email": "manager02@youthfashion.com" }
}
```
