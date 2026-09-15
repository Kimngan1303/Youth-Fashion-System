# GET /api/admin/employees

Lấy danh sách nhân viên trong cửa hàng (Role Manager / Admin).

## Auth

🔒 Yêu cầu Bearer Token (Role: `ADMIN` - Admin kế thừa tất cả quyền của Manager).

## Response

### 200 OK

```json
{
  "status": true,
  "data": [
    {
      "employee_id": 1,
      "email": "manager01@youthfashion.com",
      "full_name": "Nguyễn Văn Quản Lý",
      "phone": "0912345678",
      "role": "MANAGER",
      "is_active": true
    }
  ]
}
```
