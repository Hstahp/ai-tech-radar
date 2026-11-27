# TIẾN ĐỘ DỰ ÁN & HƯỚNG DẪN BẮT ĐẦU (PROGRESS.md)

> **DÀNH CHO AI AGENT & LẬP TRÌNH VIÊN:**  
> **QUY TẮC BẮT BUỘC:** Mỗi khi mở cửa sổ trò chuyện mới, agent khởi động lại hoặc bắt đầu bất kỳ task nào, **PHẢI ĐỌC FILE NÀY ĐẦU TIÊN** để nắm rõ ngữ cảnh hệ thống, những gì đã hoàn thành, những gì đang dở dang và bước tiếp theo cần làm.  
> **QUY TẮC KIỂM THỬ:** Mọi tính năng mới hoặc sửa lỗi **PHẢI ĐƯỢC VIẾT TEST VÀ CHẠY PASS 100% CÁC TRƯỜNG HỢP** (`pnpm test` & `pnpm typecheck`) trước khi commit, push hay deploy.

---

## 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

- **Ngôn ngữ:** TypeScript Strict toàn bộ monorepo (pnpm workspaces).
- **Phân chia packages:**
  - `packages/core`: Schema Zod dùng chung, kiểu dữ liệu, hằng số (`TAGS`, `CATEGORIES`, `PROMPT_VERSION`), tiện ích thuần (`url.ts`, `text.ts`).
  - `apps/pipeline`: Bot cào tin tức, chấm điểm, tóm tắt AI (Node.js 22, SQLite, Gemini/Groq fallback, RSS feed, Discord webhook).
  - `apps/worker`: Backend API chạy trên Cloudflare Worker (Hono, Chatbot RAG, Deep Explain, OAuth Google/GitHub, Admin API, Active Tags, Bookmarks).
  - `apps/web`: Frontend Web Dashboard Bento Grid (React 19 + Vite + Tailwind CSS v4 + Dark/Light mode).
  - `db/`: Schema Content DB (SQLite FTS5) và App DB (D1/SQLite).
- **Ràng buộc:** 100% tài nguyên Free Tier. Không dịch vụ trả phí, không tự ý thêm dependency nặng.

---

## 2. TIẾN ĐỘ THỰC HIỆN CHI TIẾT

### ✅ Mốc 1: MVP & Hạ tầng bảo vệ (Hoàn thành)
- [x] Monorepo pnpm workspaces & thư viện lõi `packages/core` với Zod validation.
- [x] Database SQLite, Views phân tích và tìm kiếm tiếng Việt không dấu FTS5 (`db/schema.sql`).
- [x] Pipeline thu thập dữ liệu (GitHub Trending/Search, Hacker News AI).
- [x] Tích hợp LLM đa tầng (Gemini Flash, Groq Llama, Ollama fallback) có cache nội dung.
- [x] Xuất bản tin tĩnh (`latest.json`, `search-index.json`), cấp phát RSS (`feed.xml`), gửi webhook Discord.
- [x] Web Dashboard Bento Grid hiện đại (Vite + React 19 + Tailwind v4 + Dark mode).
- [x] GitHub Actions tự động hóa hàng ngày lúc 07:00 AM VN (`daily-pipeline.yml`).
- [x] Hệ thống kiểm thử CI tự động (`ci.yml`), Husky Git hooks chặn commit lỗi và bảo vệ nhánh.

---

### ✅ Giai đoạn 2: Cloudflare Worker, Auth, Admin, Chat RAG & Paper/Bookmarks
Theo lộ trình đặc tả trong `docs/DESIGN_PHASE2_AUTH_ADMIN_CHAT.md`:

- [x] **Bước A — Nền tảng + Chatbox RAG chặt chẽ:**
  - Endpoint `POST /api/chat` tra cứu ngữ cảnh từ `search-index.json`.
  - Hallucination Guard: Zero-token rejection, kiểm tra trích dẫn (`citations`) nghiêm ngặt đối chiếu với tập tin thực tế.
  - Hỗ trợ giải đáp cả các bài tin ngắn chỉ có tiêu đề/link mà không từ chối sai.
- [x] **Bước B — Giải thích sâu theo yêu cầu (Deep Explain):**
  - Endpoint `POST /api/items/:key/explain` với cơ chế khóa mềm chống gọi trùng lặp.
  - Cache kết quả vĩnh viễn theo `(content_hash, prompt_version, lang)`.
  - Giới hạn host cho phép (chống SSRF) và hiển thị trên giao diện qua modal/trang chi tiết.
- [x] **Bước C — Xác thực OAuth & Tag cá nhân hóa:**
  - Đăng nhập OAuth 2.0 bằng Google và GitHub.
  - Người dùng đăng nhập được chọn tối đa 10 chủ đề quan tâm (#mcp, #agent, #devtools...).
  - Tab "Dành cho bạn" trên trang chủ lọc tin theo sở thích cá nhân hoàn toàn ở client (0 tốn token LLM).
- [x] **Bước D — Trang quản trị Admin & Audit Log:**
  - Route `/admin` riêng biệt cho quản trị viên (xác thực quyền ở server API, chặn 401/403).
  - Quản lý cài đặt hệ thống (`app_settings`), duyệt yêu cầu tạo tag (`tag_requests`), bật/tắt tag, quản trị người dùng.
  - Ghi nhật ký kiểm toán (`audit_log`) cho mọi thao tác nhạy cảm.
- [x] **Bước E — Thu thập theo tag hoạt động (`/internal/active-tags`):**
  - Worker cung cấp endpoint `GET /internal/active-tags` bảo vệ bằng `PIPELINE_TOKEN`.
  - Fail-safe an toàn: nếu Worker lỗi/timeout > 10s, pipeline tự động fallback về danh sách mặc định.
- [x] **Cào bài báo nghiên cứu AI uy tín (Hugging Face Daily Papers):**
  - Source Adapter `HuggingFacePapersAdapter` tại `apps/pipeline/src/sources/huggingface-papers.ts`.
  - Tự động lấy papers chất lượng cao, có upvotes từ cộng đồng, link trực tiếp tới arXiv.
  - Phân loại `category: 'paper'`, tự động gán tags (`paper`, `ai-research`, `arxiv`).
  - Unit tests: 100% passed (`apps/pipeline/tests/papers.test.ts`).
- [x] **Hệ thống Lưu bài viết (Bookmarks API, UI & DB):**
  - Migration DB `db/app-migrations/004_bookmarks.sql` (`user_bookmarks` table).
  - Zod schemas: `CreateBookmarkSchema`, `UserBookmarkItemSchema` trong `packages/core`.
  - Worker API endpoints: `/api/me/bookmarks` (GET, POST, DELETE).
  - Web UI: Nút BookmarkButton trên từng thẻ bài viết và trang chi tiết, Tab "Đã lưu 🔖", cơ chế Hoàn tác (Undo Toast 6 giây).
- [x] **Khắc phục triệt để lỗi đăng xuất sau 30 phút & Lỗi tag:**
  - Chuyển đổi session token sang chuẩn Stateless Signed JWT (HMAC-SHA256 Web Crypto): session tồn tại 30 ngày độc lập với vòng đời của worker isolate (chống việc Cloudflare tái khởi động isolate sau 30 phút xóa trắng bộ nhớ).
  - Đồng bộ `selectedTags` với `currentTags` bằng `useEffect` trong `UserTagModal` (sửa lỗi click vào modal bị hiển thị 0/10 tag).
  - Thiết kế lại `UserTagModal` tương thích hoàn hảo cả 2 chế độ Sáng (Light mode - nền trắng tinh tế) và Tối (Dark mode).

### ✅ Giai đoạn 3: Mở rộng nguồn tin & tăng volume bản tin
- [x] Đã thử adapter Reddit và X/Twitter nhưng gỡ bỏ vì các nền tảng không cấp API key khả dụng.
- [x] Thêm adapter Semantic Scholar và OpenAlex cho bài báo khoa học; Semantic Scholar cần API key, thiếu key thì tự bỏ qua thay vì gọi và nhận 429; có retry theo `Retry-After`.
- [x] Sửa key nguồn Hugging Face Papers từ `huggingface_papers` về `hf_papers` khớp seed.
- [x] Chọn tối đa 25 mục/ngày, tối đa 8 mục mỗi category, pool ứng viên 500.
- [x] Discord chỉ gửi teaser 4 tin nổi bật kèm link web; phần còn lại xem trên web.

### ✅ Giai đoạn 4: Chất lượng dữ liệu & khám phá nội dung
- [x] Dedupe xuyên nguồn bằng `urlHash` + độ giống tiêu đề (Jaccard token) trước khi chọn top.
- [x] Ghi thống kê từng nguồn vào `pipeline_runs.stats_json` và export `health.json`.
- [x] Trang “Sức khỏe” trong khu admin (`/admin/health`), chỉ hiển thị sau khi đăng nhập admin.
- [x] Bản tin tuần `/weekly` (rolling 7 ngày, đếm số ngày xuất hiện) + `weekly.json`/`weekly-feed.xml`.
- [x] Lịch sử 30 ngày `/history` + `history-index.json`, tìm kiếm và lọc theo ngày.
- [x] Digest theo ngày chuyển vào `digests/YYYY-MM-DD.json`; root chỉ giữ các file entrypoint để nhánh `data` gọn hơn.

### 🔜 Giai đoạn 5: Lưu trữ bền vững & thông báo theo chủ đề (kế hoạch)
- **Quyết định 2026-11-26:** dùng **Cloudflare D1**, không dùng Supabase, cho user/tag/thông báo/audit.
- **Lý do chọn D1:** binding native trong Worker, free 5 GB dung lượng, 5 triệu rows read/ngày và 100.000 rows written/ngày, không bị pause vì ít hoạt động, SQLite khớp schema hiện có. Supabase Free tuy đủ cho 1k user nhưng chỉ 500 MB database, 5 GB egress và tự pause sau 7 ngày ít hoạt động.
- **Phạm vi dữ liệu:** `users`, `user_tags`, `notification_prefs`, `notification_log`, `audit_log`; thay `InMemoryAppDbRepository` bằng repository D1.
- **Thông báo:** sau khi pipeline export digest, gọi worker `/internal/notify`; worker khớp tag của từng user, chống gửi trùng bằng `notification_log`, giới hạn 1 lần/ngày và giữ log 90 ngày.
- **Kênh gửi:** Telegram bot trước (miễn phí, không cần domain), kèm chuông thông báo trong web làm fallback.
- **Trạng thái:** chưa triển khai. Bước tiếp theo: thêm D1 binding trong `apps/worker/wrangler.json`, migration bảng, rồi viết `D1AppDbRepository`.
- **Sau khi có D1:** hiện lại cột “Người theo dõi” trong trang Quản lý Thẻ.

---

## 3. CÔNG VIỆC TIẾP THEO (NEXT STEPS)

1. [x] Đã hoàn thành 100% kiểm thử (21/21 test files, 97/97 tests pass, typecheck & build sạch sẽ).
2. [x] Đã trình bày chi tiết toàn bộ các thay đổi và được người dùng đồng ý commit/push.
3. [ ] Tạo Pull Request từ `feature/papers-and-bookmarks` vào nhánh `develop`.
4. [ ] Tiếp tục theo dõi và phát triển các tính năng tiếp theo theo lộ trình.

---

## 4. QUY TRÌNH LÀM VIỆC BẮT BUỘC CHO MỌI TASK (AI WORKFLOW)

1. **Trước khi bắt đầu:** Đọc `docs/PROGRESS.md`, `AGENTS.md` và `docs/GIT_WORKFLOW.md`.
2. **Quy trình Git Flow:**
   - Tạo nhánh tính năng từ `develop`: `feature/xxx` hoặc nhánh sửa lỗi `defect/xxx`.
   - Tuyệt đối không commit trực tiếp vào `develop` hoặc `main`.
3. **Quy tắc Kiểm thử (TDD / Verification Gate):**
   - Viết unit tests trước hoặc song song với tính năng (`tests/*.test.ts`).
   - Kiểm tra mọi trường hợp biên (thành công, lỗi mạng, dữ liệu sai schema, thiếu quyền).
   - Chạy lệnh kiểm tra bắt buộc:
     ```bash
     pnpm typecheck
     pnpm test
     ```
   - Chỉ khi toàn bộ unit tests **PASS 100%** mới được phép tạo commit và push.
4. **Quy chuẩn Commit:**
   - Conventional Commits tiếng Anh (`feat:`, `fix:`, `test:`, `ci:`, `docs:`).
   - **Bắt buộc tách riêng commit `test:` khỏi commit `feat:`**.
5. **Cập nhật Tiến độ:**
   - Sau khi hoàn thành một task, luôn cập nhật lại trạng thái vào `docs/PROGRESS.md`.
