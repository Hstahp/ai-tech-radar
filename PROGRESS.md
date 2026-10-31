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
  - `apps/worker`: Backend API chạy trên Cloudflare Worker (Hono, Chatbot RAG, Deep Explain, OAuth Google/GitHub, Admin API, Active Tags).
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

### ✅ Giai đoạn 2: Cloudflare Worker, Auth, Admin & Chat RAG
Theo lộ trình đặc tả trong `DESIGN_PHASE2_AUTH_ADMIN_CHAT.md`:

- [x] **Bước A — Nền tảng + Chatbox RAG chặt chẽ:**
  - Endpoint `POST /api/chat` tra cứu ngữ cảnh từ `search-index.json`.
  - Bộ lọc chống ảo giác (Hallucination Guard): Zero-token rejection, kiểm tra trích dẫn (`citations`) nghiêm ngặt đối chiếu với tập tin thực tế.
  - Hỗ trợ giải đáp cả các bài tin ngắn chỉ có tiêu đề/link (như tin Mastodon) mà không từ chối sai.
- [x] **Bước B — Giải thích sâu theo yêu cầu (Deep Explain):**
  - Endpoint `POST /api/items/:key/explain` với cơ chế khóa mềm chống gọi trùng lặp (2 request đồng thời chỉ gọi LLM 1 lần).
  - Cache kết quả vĩnh viễn theo `(content_hash, prompt_version, lang)`.
  - Giới hạn host cho phép (chống SSRF) và hiển thị trên giao diện qua modal/trang chi tiết.
- [x] **Bước C — Xác thực OAuth & Tag cá nhân hóa:**
  - Đăng nhập OAuth 2.0 bằng Google và GitHub, quản lý phiên qua Session Cookie băm an toàn (`HttpOnly; Secure; SameSite`).
  - Người dùng đăng nhập được chọn tối đa 10 chủ đề quan tâm (#mcp, #agent, #devtools...).
  - Tab "Dành cho bạn" trên trang chủ lọc tin theo sở thích cá nhân hoàn toàn ở client (0 tốn token LLM).
  - Bắt buộc đăng nhập để sử dụng tính năng Chat RAG nhằm kiểm soát hạn mức quota.
- [x] **Bước D — Trang quản trị Admin & Audit Log:**
  - Route `/admin` riêng biệt cho quản trị viên (xác thực quyền ở server API, chặn 401/403).
  - Quản lý cài đặt hệ thống (`app_settings`), duyệt yêu cầu tạo tag (`tag_requests`), bật/tắt tag, quản trị người dùng.
  - Ghi nhật ký kiểm toán (`audit_log`) cho mọi thao tác nhạy cảm.
- [x] **Bước E — Thu thập theo tag hoạt động (`/internal/active-tags`):**
  - Worker cung cấp endpoint `GET /internal/active-tags` bảo vệ bằng `PIPELINE_TOKEN`.
  - Tự động thống kê các tag có nhiều người theo dõi nhất, ưu tiên tag hệ thống và giới hạn theo `tags.max_active`.
  - Pipeline tích hợp client `fetchActiveTags` gọi Worker trước mỗi lần chạy.
  - **Cơ chế Fail-safe an toàn tuyệt đối:** Nếu Worker lỗi/timeout > 10s, pipeline tự động fallback về danh sách tag mặc định (`TAGS`) trong `packages/core`, không bao giờ bị dừng pipeline.
  - Hỗ trợ danh sách `hiddenKeys` để loại bỏ các bài viết bị admin ẩn.

---

### ✅ Cải tiến UI/UX & Tối ưu hệ thống gần nhất
- [x] **Dark / Light Mode toàn diện:**
  - Tối ưu màu sắc tương phản cao cho toàn bộ giao diện: FilterBar, DigestCard, HeaderNav, BentoCard.
  - Thiết kế lại các hộp thông báo trống (Empty States) khi tìm kiếm không thấy bài viết hoặc chưa chọn tag: nền mờ tinh tế, viền nét đứt thanh mảnh, chữ rõ nét ở cả 2 chế độ sáng/tối.
- [x] **Trang chi tiết tin tức (`/item/:key`):**
  - Bỏ nút hỏi AI thừa trong trang chi tiết, chuyển thành hiển thị chi tiết nội dung, tác giả, ngày đăng, liên kết nguồn gốc.
  - Nút quay lại bản tin thiết kế dạng pill badge tinh gọn `← Quay lại bản tin`.
  - Logo và banner header hỗ trợ bấm quay về trang chủ.
- [x] **CI/CD Tự động hóa Deploy lên Cloudflare:**
  - Cập nhật `.github/workflows/deploy.yml` bổ sung job `deploy-worker` bên cạnh `deploy-web`.
  - Mọi thay đổi Backend Worker khi merge vào `main` đều được Cloudflare Worker cập nhật tự động.

---

## 3. CÔNG VIỆC TIẾP THEO (NEXT STEPS)

### 🚀 Nhiệm vụ kế tiếp trong Giai đoạn 2:
1. **Bước F: Quản lý Pool key an toàn & Hỗ trợ BYOK (Bring Your Own Key):**
   - Hỗ trợ chế độ BYOK `browser`: Lưu API key (Gemini / Groq) trong `localStorage` của người dùng; client chuẩn bị prompt qua `POST /api/chat/prepare` và gọi LLM trực tiếp, không tốn quota hệ thống.
   - Quản lý Pool key hệ thống cho Admin (mã hóa Web Crypto AES-256-GCM, xoay key theo `soft_daily_limit`, tự động cooldown khi gặp 429).
2. **Bổ sung Source Adapter thu thập Bài Báo Nghiên Cứu (AI Papers):**
   - Viết Source Adapter mới trong `apps/pipeline/src/sources/` (ví dụ: cào từ **Hugging Face Daily Papers** hoặc **arXiv AI/CS/CL**).
   - Tự động phân loại `category: 'paper'` và gán nhãn `paper`.

---

## 4. QUY TRÌNH LÀM VIỆC BẮT BUỘC CHO MỌI TASK (AI WORKFLOW)

1. **Trước khi bắt đầu:** Đọc `PROGRESS.md`, `AGENTS.md` và `GIT_WORKFLOW.md`.
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
   - Sau khi hoàn thành một task, luôn cập nhật lại trạng thái vào `PROGRESS.md`.
