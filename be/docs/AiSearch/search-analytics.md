# Search Analytics & Model Fine-Tuning (Phân Tích Hành Vi & Tinh Chỉnh AI Search)

Tài liệu thiết kế hệ thống **Báo cáo Phân tích Hành vi Tìm kiếm và Tinh chỉnh Mô hình AI Search** cho Admin.

---

## 1. Tổng Quan Feature

Hệ thống cung cấp công cụ báo cáo analytics cho Admin nhằm theo dõi xu hướng tìm kiếm của người dùng và đánh giá chất lượng của mô hình AI Search (FashionCLIP + Qdrant Vector DB).

* **Mục tiêu:**
  * Thống kê tỷ lệ sử dụng giữa Tìm kiếm bằng ảnh (Visual Search) và Tìm kiếm bằng chữ (Text Search).
  * Phát hiện kịp thời các **Từ khóa tìm ra 0 kết quả (Zero-Result Queries)** để nhập thêm hàng hoặc bổ sung từ đồng nghĩa (Synonyms).
  * Đánh giá hiệu quả để điều chỉnh trọng số `image_weight` / `text_weight` trong bảng `ai_search_configs`.

---

## 2. Các Chỉ Số Quan Trọng (Key Metrics)

### 2.1 Tỷ lệ loại hình tìm kiếm (Search Type Distribution)
* Thống kê phần trăm lượt tìm kiếm theo `search_type` (`TEXT`, `IMAGE`, `HYBRID`).
* Giúp nhóm phát triển hiểu thói quen của người dùng (ví dụ: khách hàng thời trang tìm bằng ảnh chiếm 60% tổng số lượt tìm kiếm).

### 2.2 Thống kê tìm kiếm không có kết quả (Zero-Result Search Tracking)
* Lọc các bản ghi trong `user_search_histories` có `results_count = 0`.
* **Hành động quản trị:**
  * Nếu từ khóa là "áo sweater unisex" trả về 0 kết quả $\rightarrow$ Cập nhật từ khóa đồng nghĩa hoặc nhập thêm mẫu sweater.
  * Nếu ảnh tải lên không tìm thấy sản phẩm tương tự $\rightarrow$ Cập nhật lại vector index hoặc thêm hình ảnh mẫu cho sản phẩm trong kho.

### 2.3 Bảng xếp hạng từ khóa phổ biến (Top Searched Keywords)
* Group theo `query_text` và đếm số lượt tìm kiếm (`COUNT(*)`).
* Phục vụ cho Marketing, Banner khuyến mãi và hiển thị Auto-complete / Search Suggestion cho người dùng.

---

## 3. Thiết Kế API Draft cho Admin Report

### `GET /api/admin/reports/search-analytics`

* **Auth:** Required (Employee với Role `ADMIN` hoặc `MANAGER`)
* **Query Parameters:**
  * `start_date` (ISO Date, default: 7 ngày trước)
  * `end_date` (ISO Date, default: Hôm nay)

#### Response `200 OK`

```json
{
  "status": true,
  "message": "Lấy báo cáo phân tích tìm kiếm thành công",
  "data": {
    "summary": {
      "total_searches": 1250,
      "text_searches": 750,
      "image_searches": 400,
      "hybrid_searches": 100,
      "zero_result_searches": 45
    },
    "top_searched_queries": [
      { "query": "váy xòe nữ", "count": 120 },
      { "query": "áo sơ mi trắng", "count": 98 }
    ],
    "zero_result_queries": [
      { "query": "giày cao gót đỏ", "count": 15, "last_searched_at": "2026-09-25T08:30:00Z" }
    ]
  }
}
```

---

## 4. Các Bảng Database Liên Quan

1. **`user_search_histories`**: Bảng dữ liệu gốc lưu trữ toàn bộ lịch sử và số lượng kết quả (`results_count`).
2. **`ai_search_configs`**: Nơi Admin điều chỉnh mô hình và trọng số AI sau khi phân tích dữ liệu analytics.
