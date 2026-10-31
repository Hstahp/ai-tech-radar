# Mốc 1 (MVP) Implementation Plan: Discord Notification, RSS Feed, and Web Frontend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện Mốc 1 (MVP) gồm thông báo Discord Webhook, xuất RSS XML feed cho pipeline, và ứng dụng Web tĩnh (`apps/web`) hiển thị Bento Grid daily tech feed theo chuẩn AGENTS.md và GIT_WORKFLOW.md.

**Architecture:** Mở rộng `apps/pipeline` với các module thuần (RSS XML generator, Discord Webhook notifier), cập nhật bước export digest; sau đó khởi tạo `apps/web` (Vite + React + TypeScript + Tailwind CSS) trong pnpm monorepo để hiển thị dữ liệu tĩnh từ `data/export/latest.json`.

**Tech Stack:** TypeScript, Node.js 22, Vite, React 19, Tailwind CSS v4 / v3, Vitest, Zod, @radar/core.

**Spec:** [Y_TUONG_DU_AN_AI_TECH_RADAR_v2.md](file:///d:/IdealProject/Y_TUONG_DU_AN_AI_TECH_RADAR_v2.md) và [AGENTS.md](file:///d:/IdealProject/AGENTS.md).

## Global Constraints

- Tuân thủ nghiêm ngặt [GIT_WORKFLOW.md](file:///d:/IdealProject/GIT_WORKFLOW.md): Mọi nhánh và commit bằng tiếng Anh, format `<type>: <short description>`.
- Làm việc trên nhánh riêng `feature/mvp-discord-and-web` checkout từ `develop`.
- Không thêm dependency thừa; dùng native `fetch` của Node.js cho Discord webhook.
- Web component tuân thủ phân lớp: Presentational component riêng, logic trong hook, validate dữ liệu đầu vào bằng Zod schema từ `@radar/core`.
- Thiết kế hiện đại: Dark mode mặc định, Bento Grid, Rich Aesthetics, font Inter/Geist.

## Review Focus

1. Discord webhook payload rỗng hoặc vượt quá 6000 ký tự / 10 embeds của Discord API.
2. Web app xử lý mượt mà cả 4 trạng thái: Loading, Error, Empty, Data.
3. Không crash khi chạy pipeline mà không có biến `DISCORD_WEBHOOK_URL` (graceful skip).
4. RSS XML chuẩn định dạng RSS 2.0 / Atom hợp lệ.
5. `pnpm typecheck`, `pnpm lint`, `pnpm test` đều pass trên toàn bộ monorepo.

---

### Task 1: RSS XML Generator & Discord Webhook in Pipeline

**Files:**
- Create: `apps/pipeline/src/lib/rss.ts`
- Create: `apps/pipeline/src/lib/discord.ts`
- Create: `apps/pipeline/src/lib/rss.test.ts`
- Create: `apps/pipeline/src/lib/discord.test.ts`
- Modify: `apps/pipeline/src/config.ts`
- Modify: `apps/pipeline/src/pipeline/steps/export-digest.ts`
- Modify: `apps/pipeline/src/pipeline/run-pipeline.ts`

**Interfaces:**
- `generateRssXml(feedItems: FeedItem[], digestDate: string): string`
- `buildDiscordEmbeds(feedItems: FeedItem[], digestDate: string): DiscordWebhookPayload`
- `sendDiscordNotification(webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean>`

- [ ] **Step 1: Write unit tests for RSS generator and Discord embed builder**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `rss.ts` (RSS 2.0 XML generator)**
- [ ] **Step 4: Implement `discord.ts` (Discord webhook payload & sender with retry/timeout)**
- [ ] **Step 5: Run tests and verify they pass**
- [ ] **Step 6: Update `config.ts`, `export-digest.ts`, and `run-pipeline.ts` to export `feed.xml` and call Discord webhook if URL configured**
- [ ] **Step 7: Commit changes** (`feat: add rss feed export and discord webhook notification`)

---

### Task 2: Scaffold Web Application (`apps/web`)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/styles/globals.css`
- Modify: `package.json` (add scripts: `dev:web`, `build:web`)

**Interfaces:**
- Vite + React + Tailwind workspace package configured with `@radar/core`.

- [ ] **Step 1: Create package.json and configs for `apps/web`**
- [ ] **Step 2: Setup Tailwind CSS and design system tokens (Dark mode first, glassmorphism, accent badges)**
- [ ] **Step 3: Create base HTML and entry point `main.tsx`**
- [ ] **Step 4: Verify web builds with `pnpm --filter @radar/web build`**
- [ ] **Step 5: Commit changes** (`feat: scaffold web frontend application with vite and tailwind`)

---

### Task 3: Build Web UI Components & Data Loader

**Files:**
- Create: `apps/web/src/features/digest/api/load-digest.ts`
- Create: `apps/web/src/features/digest/hooks/useDigest.ts`
- Create: `apps/web/src/features/digest/components/VerdictBadge.tsx`
- Create: `apps/web/src/features/digest/components/DigestCard.tsx`
- Create: `apps/web/src/features/digest/components/BentoGrid.tsx`
- Create: `apps/web/src/features/digest/components/HeaderNav.tsx`
- Create: `apps/web/src/features/digest/components/FilterBar.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/features/digest/api/load-digest.test.ts`

**Interfaces:**
- `loadLatestDigest(): Promise<DigestFeedPayload>`
- `useDigest()` hook managing state: items, selectedCategory, searchQuery, filterVerdict, isLoading, error.

- [ ] **Step 1: Write test for `load-digest.ts` validating payload against Zod schema**
- [ ] **Step 2: Implement `load-digest.ts` fetching `data/export/latest.json`**
- [ ] **Step 3: Implement `useDigest` hook**
- [ ] **Step 4: Implement UI components (`HeaderNav`, `FilterBar`, `VerdictBadge`, `DigestCard`, `BentoGrid`)**
- [ ] **Step 5: Assemble `App.tsx` with responsive Bento Grid layout, search bar, tags, and dark theme**
- [ ] **Step 6: Run tests and verify they pass**
- [ ] **Step 7: Commit changes** (`feat: implement bento grid ui components and digest loader`)

---

### Task 4: Integration & Monorepo Verification

**Files:**
- Verify all monorepo checks.

- [ ] **Step 1: Run `pnpm typecheck` across all packages**
- [ ] **Step 2: Run `pnpm test` across all packages**
- [ ] **Step 3: Run web build to ensure static export builds cleanly**
- [ ] **Step 4: Create final review and report to user**
