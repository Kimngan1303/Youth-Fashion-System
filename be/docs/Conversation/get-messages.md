# GET /api/conversations/:conversation_id/messages

Lấy danh sách tin nhắn trong cuộc trò chuyện.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER` \| `MANAGER` \| `ADMIN`).

## Response

### 200 OK

```json
{
  "status": true,
  "data": [
    {
      "message_id": 101,
      "sender_type": "CUSTOMER",
      "sender_name": "Nguyễn Văn A",
      "content": "Cho em hỏi áo thun đen còn size M không ạ?",
      "created_at": "2026-09-15T16:25:00.000Z"
    }
  ]
}
```
