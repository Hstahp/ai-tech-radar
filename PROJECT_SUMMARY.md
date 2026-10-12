# TỔNG HỢP CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH — AI TECH RADAR

> **Cập nhật:** Ngày 12/10/2026  
> **Phiên bản:** Mốc 1 (MVP) hoàn thiện  
> **Trạng thái hệ thống:** Đã kiểm thử tự động, tích hợp CI/CD trên GitHub Actions và phân phối đa kênh (Web, RSS, Discord).

---

## 1. TỔNG QUAN HỆ THỐNG ĐÃ XÂY DỰNG

Dự án **AI Tech Radar** là nền tảng tự động hóa hoàn toàn (chạy 100% trên free tier), mỗi ngày thực hiện:
1. **Thu thập (Collect):** Quét các công cụ AI, repo mã nguồn mở, extension và tin tức nổi bật từ nhiều nguồn (GitHub, Hacker News, Open VSX).
2. **Lọc & Chấm điểm (Filter & Score):** Lọc nội dung rác, tính điểm độ sốt, tốc độ tăng sao, tương tác cộng đồng.
3. **Phân tích bằng LLM (Summarize & Evaluate):** Sử dụng LLM (Google Gemini / Groq / Ollama) để tóm tắt tiếng Việt (mục đích, điểm nổi bật, hành động gợi ý) và đưa ra đánh giá (`🚀 Thử ngay`, `👀 Theo dõi`, `⏭️ Bỏ qua`).
4. **Lưu trữ & Phân phối (Store & Distribute):**
   - Lưu trữ lịch sử snapshot và chỉ mục tìm kiếm Full-Text FTS5 vào SQLite.
   - Xuất dữ liệu bản tin tĩnh (`.json`) và cấp phát RSS Feed (`feed.xml`).
   - Gửi bản tin điểm tin buổi sáng tự động vào kênh **Discord** thông qua Webhook.
   - Hiển thị bảng điều khiển trực quan dạng **Bento Grid** trên nền tảng Web tĩnh.

---

## 2. CHI TIẾT CÁC THÀNH PHẦN ĐÃ HOÀN THÀNH

### 2.1. Cấu trúc Monorepo & Gói dùng chung (`packages/core`)
* **Monorepo:** Thiết lập cấu trúc monorepo tiêu chuẩn bằng `pnpm workspaces` gồm `packages/core`, `apps/pipeline`, `apps/web`.
* **TypeScript Strict:** Bật cấm `any`, kiểm soát kiểu tĩnh nghiêm ngặt trên toàn bộ codebase.
* **Schema & Validation (Zod):**
  * Định nghĩa schema chuẩn cho dữ liệu: `ItemSchema`, `SummaryItemSchema`, `DigestFeedSchema`, `ConfigSchema`.
  * Hằng số toàn hệ thống: `PROMPT_VERSION = 1`, phân loại `Category` (`repo`, `tool`, `extension`, `model`, `news`), danh mục `TAGS`.
  * Bộ parse & validate phản hồi LLM (`parseSummaries`), loại bỏ prompt injection và kiểm soát ranh giới dữ liệu.
* **Kiểm thử:** Đã viết unit test đầy đủ cho schema và validation trong thư mục `packages/core/tests/`.

---

### 2.2. Cơ sở dữ liệu SQLite & Quản trị dữ liệu (`db/`)
* **Cấu trúc bảng chuẩn (`db/schema.sql`):**
  * `items`: Lưu danh mục gốc (nguồn, external id, URL, hash, số sao ban đầu, ngôn ngữ).
  * `metrics`: Ghi lại biến động lịch sử (số sao, lượt cài đặt, điểm số theo ngày).
  * `summaries`: Lưu tóm tắt tiếng Việt, đánh giá (`verdict`), mức độ tin cậy (`confidence`), gắn với hash nội dung và phiên bản prompt để cache tối ưu.
  * `digests` & `digest_items`: Quản lý các số bản tin hàng ngày đã xuất bản và xếp hạng.
  * `pipeline_runs`: Giám sát lịch sử chạy pipeline, trạng thái (thành công/lỗi), số lượng mục đã xử lý và số token/request LLM.
* **Views & FTS5:**
  * View `v_latest_summary`: Lấy bản tóm tắt mới nhất theo từng mục.
  * View `v_digest_feed`: Kết hợp thông tin để xuất bản tin ra Web/RSS/Discord.
  * Virtual table `items_fts`: Tìm kiếm Full-Text FTS5 hỗ trợ tiếng Việt không dấu (`remove_diacritics 2`).
* **CLI quản trị:**
  * `db:migrate`: Tự động áp dụng schema và kiểm tra migration còn thiếu.
  * `db:check`: Chạy `PRAGMA integrity_check` và `PRAGMA foreign_key_check`.
  * `db:maintain`: Dọn dẹp dữ liệu cũ theo chính sách vòng đời.
* **Cơ chế Database Fallback:**
  * Tự động nhận diện và sử dụng `better-sqlite3`.
  * Trên môi trường Windows hoặc môi trường thiếu C++ build tool, tự động fallback sang `node:sqlite DatabaseSync` có sẵn của Node 22+, đảm bảo pipeline không bao giờ bị gián đoạn.

---

### 2.3. Pipeline xử lý dữ liệu (`apps/pipeline`)
Pipeline tuân thủ kiến trúc phân lớp sạch (Clean Architecture):
* **Nguồn dữ liệu (`sources/`):**
  * `github-search.ts`: Quét các repo AI trending và các topic quan trọng (`llm`, `agent`, `ai-coding`...).
  * `hacker-news.ts`: Thu thập các bài thảo luận, ra mắt công nghệ AI hàng đầu trên HN.
  * `open-vsx.ts`: Quét các tiện ích mở rộng AI mới cho môi trường lập trình VS Code / VSCodium.
* **Chấm điểm độc lập (`domain/scoring.ts`):**
  * Thuật toán thuần túy tính điểm cơ sở, độ sốt tăng trưởng và điểm tương tác.
* **Tích hợp LLM đa tầng (`llm/`):**
  * `gemini.ts`: Tích hợp Google Gemini (mặc định model Flash tối ưu tốc độ & free quota).
  * `groq.ts`: Tích hợp Groq Cloud (`llama-3.3-70b-versatile`) làm dự phòng với tốc độ suy luận cực cao.
  * `ollama.ts`: Hỗ trợ chạy mô hình cục bộ khi chạy offline.
  * `with-fallback.ts`: Chuỗi fallback thông minh, tự động chuyển provider khi gặp giới hạn tốc độ (429/quota), tự động ghi nhận nhật ký sử dụng `llm_usage`.
  * Cơ chế Cache: Tái sử dụng bản tóm tắt dựa trên `content_hash` + `prompt_version`, không gọi lại LLM vô cớ.
* **Phân phối & Xuất bản (`steps/export-digest.ts`):**
  * Xuất bản tin theo ngày: `data/export/YYYY-MM-DD.json`.
  * Xuất bản tin mới nhất: `data/export/latest.json`.
  * **Xuất RSS Feed (`lib/rss.ts`):** Tạo file `data/export/feed.xml` chuẩn RSS 2.0 để người dùng theo dõi qua các ứng dụng đọc RSS (Feedly, Inoreader, NetNewsWire...).
  * **Thông báo Discord Webhook (`lib/discord.ts`):**
    * Tự động định dạng các Embed Card trực quan với màu sắc theo đánh giá (`🚀 Thử ngay` - Xanh lá, `👀 Theo dõi` - Vàng/Cam, `⏭️ Bỏ qua` - Xám).
    * Hiển thị liên kết nguồn, các thẻ tags, mục đích và hành động cụ thể.
    * Hỗ trợ chia nhóm (batch ≤ 10 embeds) phù hợp giới hạn của Discord API.

---

### 2.4. Giao diện Web Dashboard (`apps/web`)
* **Công nghệ:** Xây dựng bằng **Vite + React 19 + Tailwind CSS v4**.
* **Thiết kế Bento Grid:** Bố cục dạng lưới hiện đại, tối ưu trải nghiệm đọc điểm tin công nghệ theo từng thẻ thông tin gọn gàng.
* **Đồng bộ Light / Dark Mode:**
  * Tích hợp hook `useTheme` tự động lưu trạng thái vào `localStorage` và đồng bộ theo cài đặt hệ thống.
  * Cấu hình `@custom-variant dark (&:where(.dark, .dark *));` tối ưu cho Tailwind CSS v4, chuyển đổi giao diện mượt mà không bị nháy.
* **Chuẩn hóa Icon với Lucide:**
  * 100% icon sử dụng thư viện `lucide-react` chuyên nghiệp (La bàn, Thẻ danh mục, Ngôi sao GitHub, Chế độ sáng tối, Liên kết ngoài). Không sử dụng emoji tạo cảm giác sơ sài.
* **Tính năng:**
  * Bộ lọc phân loại nhanh: Tất cả, Repository, Extension, Tin tức.
  * Tìm kiếm tức thì theo tiêu đề, tóm tắt và thẻ tag.
  * Hiển thị chi tiết đánh giá chuyên sâu (`VerdictBadge`), thẻ danh mục (`CategoryBadge`), liên kết trực tiếp tới tài nguyên gốc.
  * Custom middleware cho Vite dev server để tự động phục vụ file `data/export/` ở môi trường phát triển.

---

### 2.5. Tự động hóa CI/CD với GitHub Actions (`.github/workflows/daily-pipeline.yml`)
* **Lịch trình tự động (Cron):** Tự động kích hoạt hàng ngày vào lúc 07:00 sáng giờ Việt Nam (`0 0 * * *` UTC).
* **Quản lý dữ liệu không mất mát:**
  * Trước khi chạy: Tự động tải SQLite database gần nhất từ GitHub Releases (`data-latest`).
  * Sau khi chạy: Kiểm tra tính toàn vẹn của DB (`db:check`), cập nhật lại bản sao lưu vào Release asset.
  * Tự động commit các file dữ liệu mới (`latest.json`, `YYYY-MM-DD.json`, `feed.xml`) về nhánh mà không xung đột mã nguồn.
* **Tích hợp Webhook:** Tự động bắn thông báo điểm tin trực tiếp vào kênh Discord đã cấu hình ngay khi pipeline chạy xong.
* **Chạy thủ công linh hoạt (`workflow_dispatch`):**
  * Hỗ trợ cờ `dry_run` (chạy thử nghiệm không lưu DB/commit).
  * Hỗ trợ cờ `skip_llm` (chạy kiểm tra thu thập dữ liệu nhanh mà không tốn quota LLM).

---

### 2.6. Quy trình phát triển & Chuẩn hóa Git Flow (`AGENTS.md`, `GIT_WORKFLOW.md`)
* **Mô hình phân nhánh nghiêm ngặt:**
  * `main`: Nhánh chạy production, chỉ merge từ `develop`.
  * `develop`: Nhánh tích hợp chính.
  * `feature/*` và `defect/*`: Các nhánh phát triển tính năng và sửa lỗi riêng biệt, luôn checkout từ `develop` và tạo Pull Request (PR) về `develop`.
* **Quy tắc Atomic Commit (Nguyên tử):**
  * Bắt buộc tách riêng commit `test:` khỏi commit tính năng `feat:` / `fix:` để đảm bảo tính minh bạch khi theo dõi lịch sử.
  * Toàn bộ commit tuân thủ chuẩn Conventional Commits bằng tiếng Anh.
* **Các Pull Request đã hoàn thành:**
  * PR #1 (`feature/mvp-discord-and-web`): Triển khai RSS Feed, Discord Webhook, Web Bento Grid.
  * PR #2 (`defect/fix-dark-mode-and-discord-workflow`): Sửa cấu hình Dark mode cho Tailwind v4 và tích hợp secret Discord vào GitHub Workflow.
  * PR #3 (`defect/fix-pnpm-action-setup`): Khắc phục lỗi xung đột phiên bản pnpm trên GitHub Actions runner.
  * PR #5 (`feature/documentation-and-readme`): Bổ sung `README.md`, tài liệu thiết kế Giai đoạn 2 và báo cáo tổng kết dự án.

---

### 2.7. Tự động hóa CI/CD & Hệ thống bảo vệ 2 lớp (Two-Layer Defense)
* **Lớp 1: GitHub CI Workflow (`.github/workflows/ci.yml`) & Branch Protection:**
  * Thiết lập CI tự động kiểm tra `typecheck`, `lint`, `test`, `build` cho mọi Push và Pull Request vào `main` và `develop`.
  * Cấu hình Branch Protection Rules trên GitHub chặn trực tiếp push đè lên `main` và `develop`, bắt buộc thông qua Pull Request.
  * Tích hợp bot **CodeRabbit AI** tự động tóm tắt, kiểm tra lỗi và review từng dòng code trên PR (100% miễn phí).
* **Lớp 2: Kiểm soát cục bộ bằng Husky Git Hooks (`.husky/`):**
  * `pre-push`: Tự động chặn ngay tại terminal máy lập trình viên nếu có hành vi push thẳng vào `main` hoặc `develop`, đồng thời tự động chạy `pnpm typecheck` và `pnpm test` trước khi gửi code lên remote để tiết kiệm quota CI GitHub Actions.
  * `pre-commit`: Tự động kiểm tra cú pháp TypeScript (`pnpm typecheck`) trước khi cho phép tạo commit.

---

## 3. BẢNG TỔNG KẾT TIẾN ĐỘ DỰ ÁN

| Hạng mục | Trạng thái | Ghi chú |
| :--- | :---: | :--- |
| Thu thập đa nguồn (GitHub, HN, Open VSX) | ✅ Hoàn thành | Hoạt động ổn định, tự khử trùng lặp |
| Chấm điểm & Xếp hạng | ✅ Hoàn thành | Tính điểm sốt và tốc độ tăng trưởng |
| Tóm tắt & Đánh giá tiếng Việt qua LLM | ✅ Hoàn thành | Đã hỗ trợ Gemini & Groq fallback |
| Cơ sở dữ liệu SQLite & FTS5 | ✅ Hoàn thành | Hỗ trợ fallback `node:sqlite` trên Windows |
| Xuất bản tin JSON theo ngày | ✅ Hoàn thành | Lưu trữ tại `data/export/` |
| RSS Feed XML (`feed.xml`) | ✅ Hoàn thành | Hỗ trợ mọi ứng dụng đọc RSS |
| Điểm tin Discord qua Webhook | ✅ Hoàn thành | Tự động phân loại màu sắc và đánh giá |
| Web Dashboard Bento Grid | ✅ Hoàn thành | Vite + React 19 + Tailwind v4 + Dark Mode |
| GitHub Actions Pipeline 07:00 AM | ✅ Hoàn thành | Đã chạy thử nghiệm thành công |
| GitHub CI Workflow (Test, Typecheck, Build) | ✅ Hoàn thành | `.github/workflows/ci.yml` |
| Husky Git Hooks (`pre-push`, `pre-commit`) | ✅ Hoàn thành | Phòng thủ 2 lớp, cấm push trực tiếp |
| Tích hợp CodeRabbit AI Review | ✅ Hoàn thành | Tự động review mọi PR trên GitHub |
| Bộ kiểm thử tự động (Unit Tests) | ✅ Hoàn thành | 100% tests pass (`@radar/core`, pipeline, web) |

