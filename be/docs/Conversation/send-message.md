# POST /api/conversations/:conversation_id/messages

Gửi tin nhắn trong cuộc trò chuyện.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER` \| `MANAGER` \| `ADMIN`).

## Request Body

```json
{
  "content": "Dạ áo này bên em sẵn hàng size M anh nhé!"
}
```

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| content | string | ✅ | 1-2000 ký tự |

## Response

### 201 Created

```json
{
  "status": true,
  "data": {
    "message_id": 102,
    "content": "Dạ áo này bên em sẵn hàng size M anh nhé!",
    "created_at": "2026-09-15T16:26:00.000Z"
  }
}
```
