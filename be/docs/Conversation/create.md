# POST /api/conversations

Tạo hội thoại tư vấn trực tuyến mới.

## Auth

🔒 Yêu cầu Bearer Token (Role: `CUSTOMER`).

## Response

### 201 Created

```json
{
  "status": true,
  "data": {
    "conversation_id": 1,
    "customer_id": 10
  }
}
```
