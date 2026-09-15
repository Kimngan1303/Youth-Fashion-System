# GET /api/conversations

Lấy danh sách các cuộc trò chuyện tư vấn giữa Khách hàng và Manager.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER` \| `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "data": [
    {
      "conversation_id": 1,
      "customer_name": "Nguyễn Văn A",
      "manager_name": "Trần Văn B (Staff)",
      "last_message": "Dạ áo này bên em còn size L anh nhé!",
      "updated_at": "2026-09-15T16:30:00.000Z"
    }
  ]
}
```
