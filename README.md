# 📡 AI Tech Radar (DevPulse AI)

> **Hệ thống tự động theo dõi, chắt lọc và tóm tắt công nghệ AI hàng ngày dành cho lập trình viên — vận hành 100% bằng tài nguyên miễn phí (Free Tier).**

[![Daily Pipeline](https://github.com/Hstahp/ai-tech-radar/actions/workflows/daily-pipeline.yml/badge.svg)](https://github.com/Hstahp/ai-tech-radar/actions/workflows/daily-pipeline.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-10.x-orange.svg)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Điểm nổi bật

* 🔄 **Thu thập tự động đa nguồn:** Quét liên tục GitHub Trending/Topics, Hacker News AI discussions, và Open VSX AI extensions.
* 🧠 **Tóm tắt & Đánh giá bằng LLM:** Tự động phân tích mục đích, điểm nổi bật, hành động gợi ý và gán nhãn khuyến nghị (`🚀 Thử ngay`, `👀 Theo dõi`, `⏭️ Bỏ qua`) bằng Google Gemini / Groq / Ollama.
* ⚡ **Zero-cost & Fallback thông minh:** Tự động chuyển đổi giữa Gemini và Groq khi chạm giới hạn quota; cache nội dung chống gọi trùng lặp; tự động chuyển đổi SQLite driver trên Windows.
* 📰 **Phân phối đa kênh:**
  * **Web Dashboard:** Giao diện Bento Grid hiện đại (Vite + React 19 + Tailwind CSS v4) hỗ trợ Light/Dark mode.
  * **RSS Feed:** Cung cấp chuẩn `feed.xml` cho mọi ứng dụng đọc tin (Feedly, Inoreader...).
  * **Discord Webhook:** Tự động gửi card điểm tin trực quan vào kênh Discord mỗi buổi sáng.
* 🤖 **Tự động hóa hoàn toàn với GitHub Actions:** Lên lịch chạy lúc **07:00 AM (giờ Việt Nam)** mỗi ngày, tự động sao lưu SQLite Database vào GitHub Release.

---

## 🏗️ Kiến trúc hệ thống (Monorepo)

Dự án được tổ chức theo mô hình **pnpm workspaces**:

```
ai-tech-radar/
├── packages/
│   └── core/                 # Thư viện dùng chung (Zod schemas, types, LLM interface, utilities)
├── apps/
│   ├── pipeline/             # Batch pipeline thu thập, chấm điểm, tóm tắt và xuất bản tin
│   ├── web/                  # Web Dashboard tĩnh (Vite + React 19 + Tailwind v4 + Bento Grid)
│   └── worker/               # API endpoint (Cloudflare Worker - Chat RAG, Deep Explain, Auth)
├── db/
│   ├── schema.sql            # Schema Content SQLite, Views, Triggers và FTS5
│   └── migrations/           # Các bản migration cơ sở dữ liệu
├── prompts/                  # Quản lý prompt hệ thống cho LLM theo phiên bản
├── data/
│   └── export/               # Dữ liệu xuất bản tĩnh (latest.json, YYYY-MM-DD.json, feed.xml)
└── .github/workflows/        # Workflow GitHub Actions tự động hóa hàng ngày
```

---

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ

### 1. Yêu cầu môi trường
* **Node.js:** phiên bản `22.x` trở lên.
* **pnpm:** phiên bản `10.x` (`corepack enable pnpm`).

### 2. Cài đặt dependencies
```bash
pnpm install
```

### 3. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Điền các biến môi trường cần thiết:
```env
# LLM Provider (Miễn phí từ Google AI Studio hoặc Groq)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Discord Notification (Tùy chọn)
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# Pipeline Settings
DATABASE_PATH=data/radar.db
EXPORT_PATH=data/export
```

### 4. Khởi tạo cơ sở dữ liệu
```bash
pnpm --filter @radar/pipeline run db:migrate
```

### 5. Chạy pipeline thu thập & điểm tin
```bash
# Chạy đầy đủ (Fetch -> Filter -> Score -> Summarize LLM -> Export)
pnpm --filter @radar/pipeline run run

# Hoặc chạy thử nghiệm không gọi LLM
pnpm --filter @radar/pipeline run run -- --skip-llm
```

### 6. Khởi chạy Web Dashboard
```bash
pnpm --filter @radar/web run dev
```
Truy cập giao diện tại: `http://localhost:5173`.

---

## 🧪 Kiểm thử & Kiểm tra chất lượng mã nguồn

Dự án tuân thủ tiêu chuẩn chất lượng nghiêm ngặt theo [AGENTS.md](AGENTS.md):

```bash
# Chạy toàn bộ unit tests (Vitest)
pnpm test

# Kiểm tra kiểu dữ liệu TypeScript
pnpm typecheck
```

### 🛡️ Hệ thống phòng thủ 2 lớp (Two-Layer Defense)
* **Lớp 1 (GitHub Server):** CI Workflow (`.github/workflows/ci.yml`) tự động kiểm tra code trên PR; Branch Protection cấm push thẳng vào `main`/`develop`; bot CodeRabbit AI tự động review từng dòng code.
* **Lớp 2 (Local Machine):** Husky Git Hooks (`.husky/pre-push`, `.husky/pre-commit`) tự động chặn push đè vào `main`/`develop` ngay tại terminal và chạy kiểm thử trước khi gửi code.

---

## 🗺️ Lộ trình phát triển (Roadmap)

* [x] **Mốc 1 (MVP) & Hạ tầng bảo vệ:**
  * [x] Kiến trúc Monorepo & Core Package với Zod validation.
  * [x] Database SQLite, Views phân tích và tìm kiếm tiếng Việt FTS5.
  * [x] Backend Pipeline (GitHub, Hacker News, Open VSX).
  * [x] Tích hợp LLM đa tầng (Gemini / Groq / Ollama) với cơ chế fallback và cache.
  * [x] Xuất JSON, RSS Feed XML và gửi Webhook thông báo Discord.
  * [x] Web Dashboard Bento Grid (React 19 + Tailwind v4 + Dark mode + Lucide icons).
  * [x] Tự động hóa CI/CD GitHub Actions hàng ngày lúc 07:00 AM VN.
  * [x] Hệ thống kiểm thử CI tự động, Husky Git hooks bảo vệ nhánh cục bộ và tích hợp CodeRabbit AI.
* [ ] **Giai đoạn 2 (Cloudflare Worker & RAG Chatbox - theo [DESIGN_PHASE2_AUTH_ADMIN_CHAT.md](DESIGN_PHASE2_AUTH_ADMIN_CHAT.md)):**
  * [ ] **Bước A:** Nền tảng + Chatbox RAG chặt (zero-token rejection, trích dẫn chuẩn, Turnstile).
  * [ ] **Bước B:** Cơ chế giải thích sâu (Deep explain) có cache theo bài viết.
  * [ ] **Bước C:** Đăng nhập GitHub OAuth, lưu phiên và lọc thẻ (tags) cá nhân hóa.
  * [ ] **Bước D:** Trang quản trị Admin cơ bản và nhật ký kiểm toán (`audit_log`).
  * [ ] **Bước E:** Thu thập theo tag hoạt động (`/internal/active-tags`).
  * [ ] **Bước F:** Quản lý Pool key an toàn & Hỗ trợ BYOK (Bring Your Own Key).
* [ ] **Mốc 3:** Browser Extension (WXT, Manifest V3).

Chi tiết tiến độ thực hiện được cập nhật liên tục tại [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).

---

## 🤝 Quy chuẩn đóng góp (Git Flow)

Vui lòng đọc kỹ hướng dẫn trước khi đóng góp:
* [AGENTS.md](AGENTS.md): Quy tắc clean code, kiến trúc phân lớp và quy chuẩn đặt tên.
* [GIT_WORKFLOW.md](GIT_WORKFLOW.md): Quy trình chia nhánh Git Flow và quy tắc Conventional Commits (**bắt buộc tách riêng commit `test:` khỏi commit `feat:`**).

---

## 📄 Bản quyền

Phát hành dưới giấy phép [MIT License](LICENSE).
