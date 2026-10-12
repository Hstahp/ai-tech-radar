# ĐỀ ÁN DỰ ÁN: AI TECH RADAR (DEVPULSE AI) — PHIÊN BẢN 2

> **Radar công nghệ & điểm tin AI thông minh dành cho lập trình viên — vận hành 100% bằng tài nguyên miễn phí.**

| | |
| :--- | :--- |
| **Phiên bản** | 2.0 (cập nhật 06/10/2026) |
| **Tên dự án** | AI Tech Radar (hoặc DevPulse AI) |
| **Mô hình sản phẩm** | Web tĩnh + Chatbox RAG + RSS/Telegram, sau đó mở rộng sang Browser Extension |
| **Ngôn ngữ chính** | TypeScript xuyên suốt (pipeline, web, worker, extension) |
| **Ngân sách** | 0 đồng — chỉ dùng free tier và hạ tầng miễn phí |

---

## 1. TỔNG QUAN

**Mục tiêu cốt lõi:** mỗi ngày tự động thu thập, chắt lọc và tóm tắt bằng tiếng Việt những thứ đáng chú ý nhất trong hệ sinh thái AI dành cho lập trình viên (GitHub repo, extension AI coding, MCP server, model mới, bài báo, tin nóng), đồng thời cho phép người dùng hỏi đáp trực tiếp về kho tin của ngày.

**Người dùng mục tiêu:** lập trình viên Việt Nam muốn theo kịp công nghệ AI mà không có thời gian lướt GitHub, Hacker News, Reddit, X mỗi ngày.

**Câu hỏi sản phẩm phải trả lời được trong 30 giây:**
1. Cái này làm được gì?
2. Tại sao nó đang hot?
3. Có nên thử ngay không (try now / watch / skip)?

---

## 2. BÀI TOÁN & GIẢI PHÁP

### 2.1. Vấn đề

- **Quá tải thông tin:** hàng chục repo, extension và bản cập nhật model xuất hiện mỗi ngày.
- **Nguồn rời rạc:** phải theo dõi nhiều nơi để không bị tụt hậu (FOMO).
- **Rào cản ngôn ngữ:** phần lớn tài liệu là tiếng Anh, dài dòng.

### 2.2. Giải pháp

1. **Mở ra là thấy bản tin đã chọn lọc:** top repo, top extension, tin lớn, paper và model nổi bật của ngày.
2. **Tóm tắt tiếng Việt có cấu trúc:** mục đích, điểm nổi bật, hành động, kèm khuyến nghị.
3. **Chatbox hỏi đáp** trên đúng kho tin của ngày (và các ngày gần đây qua tìm kiếm full-text).
4. **Nhiều kênh nhận tin nhẹ chi phí:** RSS, Telegram/Discord bot, PWA.

---

## 3. NGUYÊN TẮC THIẾT KẾ

1. **Tĩnh trước, động sau.** Dashboard là dữ liệu cập nhật theo ngày, nên build thành trang tĩnh. Chỉ chatbox cần backend.
2. **Gọi LLM theo lô, không gọi theo người dùng.** Cả bản tin ngày gom vào 1 request (tối đa vài request).
3. **LLM chỉ là bước cuối.** Lọc, loại trùng, xếp hạng bằng code thường (zero-token).
4. **Không phụ thuộc một nhà cung cấp.** Tên model nằm trong config, có chuỗi fallback.
5. **Dữ liệu có vòng đời.** Raw giữ ngắn hạn, summary và metrics giữ lâu dài.
6. **Luôn có bản tin để hiển thị.** Pipeline lỗi thì web vẫn hiện bản tin hôm trước và bạn nhận cảnh báo.
7. **Chống bịa.** LLM chỉ nhận tiêu đề + mô tả ngắn, trả JSON theo schema, luôn kèm link nguồn.

---

## 4. TÍNH NĂNG

### 4.1. Radar tin tức & công cụ hot (Daily Tech Feed)

| Mục | Nội dung | Nguồn dự kiến |
| :--- | :--- | :--- |
| **GitHub AI Radar** | Repo mới nổi hoặc tăng sao nhanh theo chủ đề `ai`, `llm`, `agents`, `mcp-server`, `code-assistant` | GitHub Search API (chính thức); GitHub Trending chỉ là nguồn phụ |
| **Extension Radar** | Extension AI coding mới / đáng chú ý | Open VSX API (ưu tiên); VS Code Marketplace là nguồn phụ, không có API chính thức |
| **AI News** | Tin nóng từ cộng đồng | Hacker News Firebase API, RSS |
| **Papers** | Bài báo nổi bật trong ngày | Hugging Face Daily Papers, arXiv |
| **Models** | Model mới ra mắt | Hugging Face, RSS blog chính thức |

**Định dạng tóm tắt (mỗi mục):**
- 🎯 **Mục đích:** giải quyết vấn đề gì?
- ⭐ **Điểm nổi bật:** vì sao cộng đồng quan tâm?
- 🔗 **Hành động:** việc nên làm tiếp theo, kèm link
- 🧭 **Khuyến nghị:** `try_now` / `watch` / `skip`

### 4.2. Xếp hạng bằng điểm (thay cho bộ lọc `stars > 100`)

```
score = 0.40 * velocity      # tốc độ tăng sao/điểm so với snapshot trước
      + 0.20 * recency       # độ mới
      + 0.20 * quality       # rating, license, README, hoạt động gần đây
      + 0.10 * source_weight # trọng số nguồn
      + 0.10 * novelty       # chưa từng xuất hiện trong bản tin trước
```
Sau khi chấm điểm, áp dụng **giới hạn đa dạng** (ví dụ tối đa 2 mục cùng một tag chính trong top) để bản tin không bị lặp chủ đề.

Muốn có `velocity` thì phải lưu **snapshot metrics hằng ngày** (bảng `metrics`). Đây là nền tảng cho tính năng "viral" ở giai đoạn sau.

### 4.3. Chatbox RAG

- **Ngữ cảnh hẹp:** nạp bản tin của ngày (khoảng 20–50 mục) vào prompt.
- **Mở rộng theo thời gian:** khi hỏi xuyên nhiều ngày thì dùng **SQLite FTS5** lấy top 10 mục liên quan rồi mới gửi cho LLM. Chỉ thêm embedding (sqlite-vec) nếu FTS5 không đủ tốt.
- **Bảo vệ quota (bắt buộc):** chatbox là nơi duy nhất tiêu tốn token theo người dùng, nên cần:
  - giới hạn theo IP/phiên,
  - Cloudflare Turnstile chống bot,
  - cache câu hỏi phổ biến (`chat_cache`),
  - tùy chọn **BYOK** (người dùng nhập API key riêng) hoặc model chạy trong trình duyệt (WebLLM).

> Lưu ý: dashboard tốn 0 token cho mỗi lượt xem, nhưng chatbox thì **không**. Phiên bản 1 của đề án đã bỏ sót điểm này.

### 4.4. Kênh phân phối

- **RSS/Atom feed** (rất rẻ, làm ngay từ MVP)
- **Telegram / Discord bot** gửi bản tin buổi sáng
- **PWA** (cài như app, không qua store)
- **Browser Extension** (giai đoạn cuối)
- **Xuất Markdown**, bookmark

---

## 5. KIẾN TRÚC HỆ THỐNG

```
[ GitHub Actions — cron 07:00 giờ VN ]
        │
        ├─ 1. Fetch nguồn (GitHub Search, HN, Open VSX, HF, arXiv)
        ├─ 2. Zero-token filter: lọc rác, loại trùng (url_hash), chấm điểm
        ├─ 3. Lưu items + metrics vào SQLite
        ├─ 4. Chọn top N → gọi LLM 1 request (JSON mode) → validate bằng Zod
        ├─ 5. Lưu summaries, tạo digest + digest_items
        └─ 6. Export JSON/RSS → commit vào repo  ──►  Cloudflare Pages / GitHub Pages tự build
                 │
                 └─ Upload radar.db lên GitHub Release (không phình lịch sử git)

[ Người dùng ]
        ├─ Web tĩnh (Astro hoặc Vite + React): đọc JSON, lọc tag, tìm kiếm
        ├─ Chatbox ──► Cloudflare Worker (rate limit + Turnstile + cache) ──► LLM
        ├─ RSS / Telegram
        └─ Extension (sau này)
```

### 5.1. Lưu trữ dữ liệu

- **SQLite** là nguồn dữ liệu chính. Quy mô ~20–50 tin/ngày ≈ vài chục MB/năm nên không cần DB nặng hơn.
- **File `radar.db` không commit vào git** (file nhị phân sẽ làm phình lịch sử). Lưu như asset của một GitHub Release, tải về và upload lại mỗi lần chạy.
- **Bản export JSON** theo ngày (`data/export/YYYY-MM-DD.json`) được commit vào repo: nhỏ, dễ xem diff, là nguồn dữ liệu cho web tĩnh.
- **Schema chi tiết:** xem `schema.sql`.

### 5.2. Vòng đời dữ liệu

| Dữ liệu | Thời gian giữ |
| :--- | :--- |
| `raw_json` của item | 60 ngày, sau đó đặt NULL |
| `items`, `summaries`, `digests` | Vĩnh viễn |
| `metrics` | Vĩnh viễn với mục từng lên bản tin; mục còn lại giữ 30 ngày |
| `chat_cache` | 7 ngày |
| `pipeline_runs`, `llm_usage` | 180 ngày |

### 5.3. Khi nào đổi database?

Chỉ khi có tài khoản người dùng, bookmark đồng bộ hoặc nhiều tiến trình ghi. Khi đó chuyển sang Cloudflare D1 hoặc Turso (đều là SQLite nên gần như giữ nguyên schema).

---

## 6. CHIẾN LƯỢC TỐI ƯU TÀI NGUYÊN MIỄN PHÍ

> Giới hạn free tier thay đổi thường xuyên. Mọi con số dưới đây cần **kiểm tra lại tại thời điểm triển khai**.

| Hạng mục | Lựa chọn | Ghi chú |
| :--- | :--- | :--- |
| **Cron + crawler + gọi LLM** | GitHub Actions | Repo public thường được dùng runner tiêu chuẩn miễn phí; kiểm tra điều khoản hiện hành. Workflow theo lịch có thể bị vô hiệu hóa nếu repo không hoạt động lâu, hãy kiểm tra định kỳ. |
| **LLM chính** | Gemini API (free tier) | Dùng dòng Flash / Flash-Lite thế hệ hiện hành. Gemini 2.0 đã ngừng, Gemini 2.5 dự kiến ngừng 16/10/2026. Xem giới hạn thực tế tại AI Studio. |
| **LLM dự phòng** | Groq (Llama), Ollama local | Tự động chuyển khi gặp lỗi 429 hoặc hết quota. |
| **Lưu DB** | GitHub Release asset | Không phình lịch sử git. |
| **Host web** | Cloudflare Pages / GitHub Pages | Trang tĩnh. |
| **Chat endpoint** | Cloudflare Workers | Rate limit và cache ở đây. |
| **Chống bot** | Cloudflare Turnstile | Miễn phí. |
| **Thông báo** | Telegram Bot API | Miễn phí. |

**Lưu ý về quyền riêng tư:** free tier của Gemini cho phép Google dùng dữ liệu gửi lên để cải thiện sản phẩm. Dữ liệu tin tức công khai thì không sao, nhưng câu hỏi chat của người dùng thì nên thông báo rõ hoặc cho phép BYOK/model local.

**Mẹo tiết kiệm request:** free tier giới hạn theo số request nhiều hơn theo token. Gom cả lô tin vào một request trả về mảng JSON; ngân sách chỉ khoảng 1–3 request/ngày cho pipeline.

---

## 7. TECH STACK

| Lớp | Công nghệ |
| :--- | :--- |
| **Ngôn ngữ** | TypeScript (strict) |
| **Monorepo** | pnpm workspaces |
| **Pipeline** | Node.js 22, `better-sqlite3`, `zod`, `p-limit`, `undici`/fetch |
| **Web** | Astro (trang tĩnh + React island cho chat) hoặc Vite + React, Tailwind CSS (Bento Grid, dark mode) |
| **Chat backend** | Cloudflare Worker (TypeScript) |
| **Extension** | WXT (Manifest V3) |
| **Kiểm thử** | Vitest |
| **Chất lượng mã** | ESLint, Prettier, `tsc --noEmit` trong CI |

**Vì sao TypeScript xuyên suốt:** pipeline, web và extension dùng chung một bộ schema (Zod). Khi LLM trả JSON sai cấu trúc thì bị chặn ngay ở bước validate thay vì làm hỏng web.

**Cấu trúc repo đề xuất:**

```
ai-tech-radar/
├─ .github/workflows/daily-pipeline.yml
├─ db/
│  ├─ schema.sql              # schema khởi tạo (version 1)
│  └─ migrations/             # các migration tiếp theo
├─ prompts/
│  └─ summarize_prompt.md     # prompt + JSON schema (version hóa)
├─ packages/
│  └─ core/                   # Zod schema, provider LLM, tiện ích dùng chung
├─ apps/
│  ├─ pipeline/               # fetch → filter → score → summarize → export
│  ├─ web/                    # dashboard tĩnh
│  ├─ worker/                 # chat endpoint
│  └─ extension/              # giai đoạn cuối
├─ data/
│  └─ export/                 # JSON theo ngày (commit)
└─ .gitignore                 # bỏ qua data/radar.db
```

---

## 8. RỦI RO & CÁCH XỬ LÝ

| Rủi ro | Cách xử lý |
| :--- | :--- |
| Model bị khai tử / đổi tên | Tên model trong config; chuỗi fallback; theo dõi thông báo deprecation |
| Hết quota free | Bảng `llm_usage` theo dõi; tự chuyển provider; giảm số mục |
| Nguồn không có API chính thức | Ưu tiên API chính thức; scrape chỉ là dự phòng, có thể bị gỡ bất cứ lúc nào |
| LLM bịa nội dung | Chỉ gửi tiêu đề + mô tả; JSON schema; trường `confidence`; luôn kèm link nguồn |
| Lạm dụng chatbox | Rate limit, Turnstile, cache, BYOK |
| Pipeline lỗi | Web hiển thị bản tin gần nhất; cảnh báo qua Telegram; DB có bản sao `radar-prev.db` |
| Vấn đề bản quyền nội dung | Chỉ hiển thị tóm tắt ngắn + link gốc, không đăng lại nguyên bài; tuân thủ ToS của từng API |
| Workflow bị tắt do repo ít hoạt động | Kiểm tra định kỳ; commit dữ liệu hằng ngày giúp repo luôn có hoạt động |

---

## 9. LỘ TRÌNH TRIỂN KHAI

### Giai đoạn 0 — Nền móng (~1 tuần)
* [x] Kiểm tra kết nối GitHub API và Hacker News
* [ ] Khởi tạo monorepo TypeScript (pnpm), cấu hình lint/test
* [ ] Áp dụng `schema.sql`, viết lớp truy cập DB và migration runner
* [ ] Viết lớp `LLMProvider` (Gemini, Groq, Ollama) với fallback và ghi `llm_usage`
* [ ] Dựng workflow GitHub Actions chạy thử ở chế độ dry-run

### Giai đoạn 1 — MVP
* [ ] Crawler: GitHub Search API + Hacker News
* [ ] Bộ lọc zero-token, loại trùng, chấm điểm
* [ ] Tóm tắt batch bằng `summarize_prompt.md`, validate bằng Zod
* [ ] Export JSON + **RSS feed**
* [ ] Web tĩnh hiển thị bản tin theo ngày
* [ ] Cảnh báo lỗi pipeline qua Telegram

### Giai đoạn 2 — Chiều sâu dữ liệu
* [ ] Thêm nguồn: Open VSX, Hugging Face Papers, arXiv
* [ ] Snapshot `metrics` hằng ngày và bảng xếp hạng "tăng nhanh nhất"
* [ ] Lọc theo tag, tìm kiếm FTS5, trang lịch sử theo ngày
* [ ] Bot Telegram/Discord gửi bản tin sáng

### Giai đoạn 3 — Chatbox
* [ ] Cloudflare Worker cho chat + Turnstile + rate limit + `chat_cache`
* [ ] RAG ngữ cảnh hẹp (bản tin hôm nay) rồi mở rộng bằng FTS5
* [ ] Chế độ BYOK / WebLLM (tùy chọn)

### Giai đoạn 4 — Mở rộng đa nền tảng
* [ ] PWA (cài đặt, offline đọc bản tin gần nhất)
* [ ] Chrome Extension (popup + new tab) bằng WXT
* [ ] Thông báo khi mục đạt mốc "viral" đột biến
* [ ] Bookmark, xuất Markdown, bản tin tuần

### Về sau
* [ ] Cá nhân hóa theo tag người dùng theo dõi
* [ ] Đánh giá chất lượng tóm tắt định kỳ (so sánh `prompt_version`)

---

## 10. CHỈ SỐ THÀNH CÔNG (KPI)

| Chỉ số | Mục tiêu |
| :--- | :--- |
| Số request LLM cho pipeline mỗi ngày | ≤ 5 |
| Thời gian chạy pipeline | < 10 phút |
| Tỷ lệ JSON hợp lệ ngay lần đầu | ≥ 95% |
| Số ngày liên tiếp có bản tin | ≥ 30 ngày không gián đoạn |
| Chi phí vận hành | 0 đồng |

---

## 11. TÀI LIỆU KÈM THEO

| File | Nội dung |
| :--- | :--- |
| `schema.sql` | Schema SQLite hoàn chỉnh (bảng, index, FTS5, trigger, view, dữ liệu mồi, ghi chú bảo trì) |
| `daily-pipeline.yml` | Workflow GitHub Actions mẫu (đặt tại `.github/workflows/`) |
| `summarize_prompt.md` | Prompt tóm tắt dạng JSON, JSON Schema, Zod schema, ví dụ, prompt sửa lỗi và prompt chat RAG |
