# Giai đoạn 2 — Bước D: Admin Dashboard & Audit Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai toàn diện Bước D của Giai đoạn 2: Migration 003, hệ thống phân quyền Admin trên Cloudflare Worker, ghi nhật ký kiểm toán `audit_log`, quản lý cấu hình runtime / tags / users, và giao diện quản trị Admin Bento Dashboard trên web.

**Architecture:** Bổ sung Migration 003 trong App DB; mở rộng Cloudflare Worker (`apps/worker`) với middleware `requireAdmin`, service `recordAuditLog`, repository các thực thể admin và router `/api/admin/*`; bổ sung Zod schemas trong `packages/core`; xây dựng module `features/admin` trên web (`apps/web`) với 5 tab quản trị (Tổng quan, Cấu hình, Quản lý Tag, Quản lý Người dùng, Nhật ký Kiểm toán).

**Tech Stack:** TypeScript strict, Cloudflare Workers / Hono, SQLite / D1 (tương thích `node:sqlite`), React 19, Tailwind CSS v4, Lucide Icons, Zod, Vitest.

**Spec:** [DESIGN_PHASE2_AUTH_ADMIN_CHAT.md](file:///d:/IdealProject/DESIGN_PHASE2_AUTH_ADMIN_CHAT.md) (Mục 4.3, 10.1, 11, 12, 13) và [AGENTS.md](file:///d:/IdealProject/AGENTS.md).

## Global Constraints

- **Git Flow & Commit Conventions:** Phải tuân thủ nghiêm ngặt [GIT_WORKFLOW.md](file:///d:/IdealProject/GIT_WORKFLOW.md): commit bằng tiếng Anh theo Conventional Commits, **bắt buộc tách commit `feat:` và commit `test:`**.
- **Clean Architecture & Separation of Concerns:** SQL chỉ nằm trong `repositories/`; route chỉ parse/validate và trả kết quả; logic nằm trong service; không gọi API trực tiếp trong presentational UI.
- **Bảo mật tuyệt đối:** Không bao giờ ghi khóa bí mật vào `audit_log`; kiểm tra quyền admin ở phía API server cho mọi endpoint admin; chặn 401 nếu chưa đăng nhập, 403 nếu không phải admin.
- **Không phá vỡ tính tương thích:** Mọi migration chỉ thêm bảng hoặc view mới (`IF NOT EXISTS`), không sửa đổi dữ liệu đã có.

## Review Focus

1. Người dùng chưa đăng nhập hoặc role `user` không thể gọi bất kỳ endpoint `/api/admin/*` nào (chặn đúng mã HTTP 401 / 403 với schema `{ error: { code, message } }`).
2. Mọi thay đổi cấu hình (`settings`), quản lý tag (`tags`, `tag-requests`), hoặc quản trị người dùng (`users`) đều ghi vết chính xác vào `audit_log` với `actor_user_id`.
3. Giao diện Web hiển thị nút truy cập Admin chỉ khi người dùng có `role === 'admin'`.
4. Người dùng có vai trò `admin` có thể duyệt đề xuất tag của user; khi duyệt thành công, tag tự động kích hoạt trong `tag_settings`.
5. Đảm bảo toàn bộ 30 tests hiện tại và các tests mới đều pass (`vitest run`), `pnpm typecheck` và `pnpm lint` 100% sạch lỗi.

---

### Task 1: Database Migration 003 (`db/app-migrations/003_admin.sql`) & Core Schemas

**Files:**

- Create: `db/app-migrations/003_admin.sql`
- Modify: `packages/core/src/schemas.ts`
- Modify: `apps/worker/src/repositories/app-db.ts`

**Interfaces:**

- `tag_settings`: `(slug TEXT PK, label TEXT, enabled INTEGER, is_system INTEGER, max_items INTEGER)`
- `tag_requests`: `(id INTEGER PK, user_id TEXT FK, slug_proposed TEXT, label TEXT, reason TEXT, status TEXT, reviewed_by TEXT, reviewed_at TEXT, created_at TEXT)`
- `v_active_tags`: `VIEW (slug, label, max_items, is_system, followers)`
- `audit_log`: `(id INTEGER PK AUTOINCREMENT, actor_user_id TEXT, action TEXT, target_type TEXT, target_id TEXT, metadata_json TEXT, created_at TEXT)`
- Zod Schemas trong `@radar/core`:
    - `AdminSettingUpdateSchema`
    - `AdminTagUpdateSchema`
    - `AdminTagCreateSchema`
    - `TagRequestCreateSchema`
    - `TagRequestReviewSchema`
    - `AdminUserUpdateSchema`

- [x] **Step 1: Tạo file migration `db/app-migrations/003_admin.sql`**
    - Khởi tạo bảng `tag_settings`, `tag_requests`, View `v_active_tags`, và bảng `audit_log`.
    - Nạp danh sách thẻ mặc định ban đầu từ hằng số `TAGS` của `@radar/core` với `enabled = 1, is_system = 1`.
- [x] **Step 2: Cập nhật `packages/core/src/schemas.ts`**
    - Khai báo các Zod schemas phục vụ validate payload cho các API admin và tag request.
- [x] **Step 3: Cập nhật `apps/worker/src/repositories/app-db.ts`**
    - Đảm bảo hàm khởi tạo test / migration tự động nạp cả `003_admin.sql`.
    - Bổ sung các phương thức truy vấn SQLite cho:
        - `getAppSettings()`, `updateAppSetting(key, value, actorUserId)`
        - `getTagSettings()`, `updateTagSetting(slug, updates)`, `createTagSetting(tag)`
        - `getTagRequests(status?)`, `createTagRequest(userId, slug, label, reason)`, `reviewTagRequest(id, status, reviewerId)`
        - `getAdminUsers(search?)`, `updateUserRoleAndStatus(userId, updates)`
        - `insertAuditLog(log: { actorUserId, action, targetType, targetId, metadataJson })`, `getAuditLogs(limit, offset)`
        - `getAdminOverview(today: string)`
- [x] **Step 4: Chạy typecheck để xác nhận tính toàn vẹn**
    - Run: `pnpm --filter @radar/core typecheck && pnpm --filter @radar/worker typecheck`

---

### Task 2: Backend Admin Service, Middleware & Routes (`apps/worker`)

**Files:**

- Modify: `apps/worker/src/auth/middleware.ts`
- Create: `apps/worker/src/admin/service.ts`
- Create: `apps/worker/src/admin/routes.ts`
- Modify: `apps/worker/src/auth/routes.ts`
- Modify: `apps/worker/src/index.ts`

**Interfaces:**

- Middleware: `requireAdmin` kiểm tra `c.get('user')?.role === 'admin'`, trả lỗi 403 `FORBIDDEN` nếu không hợp lệ.
- Service: `recordAuditLog(db, { actorUserId, action, targetType, targetId, metadata })`
- Sub-router `apps/worker/src/admin/routes.ts`:
    - `GET /api/admin/overview`: Thống kê hôm nay (chat, explain, token, quota, reject count).
    - `GET /api/admin/settings`: Danh sách cài đặt.
    - `PATCH /api/admin/settings`: Cập nhật cài đặt + ghi audit log.
    - `GET /api/admin/tags`: Danh sách thẻ hệ thống kèm số followers.
    - `PATCH /api/admin/tags/:slug`: Bật/tắt thẻ hoặc đổi `is_system`, `max_items` + ghi audit log.
    - `POST /api/admin/tags`: Tạo thẻ mới + ghi audit log.
    - `GET /api/admin/tag-requests`: Danh sách yêu cầu đề xuất thẻ.
    - `POST /api/admin/tag-requests/:id/review`: Phê duyệt hoặc từ chối đề xuất + ghi audit log.
    - `GET /api/admin/users`: Danh sách thành viên kèm quota sử dụng.
    - `PATCH /api/admin/users/:id`: Đổi vai trò hoặc đình chỉ/kích hoạt tài khoản + ghi audit log.
    - `GET /api/admin/audit`: Danh sách nhật ký kiểm toán.
- User Route (`apps/worker/src/auth/routes.ts`):
    - `POST /api/tag-requests`: Người dùng gửi đề xuất thẻ mới (yêu cầu đăng nhập `requireAuth`).
- Mount `/api/admin` vào `apps/worker/src/index.ts`.

- [x] **Step 1: Viết `requireAdmin` middleware trong `apps/worker/src/auth/middleware.ts`**
- [x] **Step 2: Triển khai `apps/worker/src/admin/service.ts`**
    - Hàm `recordAuditLog` ghi nhận sự kiện kiểm toán.
- [x] **Step 3: Triển khai các router trong `apps/worker/src/admin/routes.ts`**
    - Kết nối đầy đủ 11 endpoints quản trị với Zod validation và audit log.
- [x] **Step 4: Bổ sung endpoint `POST /api/tag-requests` trong `apps/worker/src/auth/routes.ts`**
- [x] **Step 5: Gắn `/api/admin` router vào `apps/worker/src/index.ts`**
- [x] **Step 6: Kiểm tra typecheck worker**
    - Run: `pnpm --filter @radar/worker typecheck`

---

### Task 3: Unit Tests cho Admin API & Phân Quyền (`apps/worker/tests/admin.test.ts`)

**Files:**

- Create: `apps/worker/tests/admin.test.ts`

**Interfaces:**

- Test suite kiểm thử toàn diện:
    1. `Unauthenticated request` tới `/api/admin/overview` bị từ chối 401 UNAUTHORIZED.
    2. Regular user (`role = 'user'`) gọi `/api/admin/overview` bị từ chối 403 FORBIDDEN.
    3. Admin user (`role = 'admin'`) gọi `/api/admin/overview` thành công 200 OK với đầy đủ chỉ số.
    4. Admin cập nhật setting `PATCH /api/admin/settings` thành công và tạo bản ghi trong `audit_log`.
    5. User gửi `POST /api/tag-requests` tạo yêu cầu trạng thái `pending`.
    6. Admin duyệt `POST /api/admin/tag-requests/:id/review` với status `approved`:
        - Yêu cầu chuyển thành `approved`.
        - Thẻ mới tự động được thêm vào `tag_settings`.
        - Ghi nhận bản ghi trong `audit_log`.
    7. Admin thay đổi trạng thái user `PATCH /api/admin/users/:id` và xác nhận bản ghi `audit_log`.

- [x] **Step 1: Viết test suite `apps/worker/tests/admin.test.ts`**
- [x] **Step 2: Chạy kiểm thử vitest để đảm bảo toàn bộ tests pass**
    - Run: `pnpm test`
    - Expected: Toàn bộ 10 test files (37+ tests) đều pass 100%.

---

### Task 4: Frontend Admin Dashboard Feature (`apps/web`)

**Files:**

- Create: `apps/web/src/features/admin/api/admin-client.ts`
- Create: `apps/web/src/features/admin/components/AdminOverviewTab.tsx`
- Create: `apps/web/src/features/admin/components/AdminSettingsTab.tsx`
- Create: `apps/web/src/features/admin/components/AdminTagsTab.tsx`
- Create: `apps/web/src/features/admin/components/AdminUsersTab.tsx`
- Create: `apps/web/src/features/admin/components/AdminAuditTab.tsx`
- Create: `apps/web/src/features/admin/components/AdminModal.tsx`
- Create: `apps/web/src/features/admin/index.ts`
- Modify: `apps/web/src/features/digest/components/HeaderNav.tsx`
- Modify: `apps/web/src/features/auth/components/UserTagModal.tsx`
- Modify: `apps/web/src/pages/HomePage.tsx`

**Interfaces:**

- `adminClient`: Gọi API với cookie credentials và header JSON.
- `AdminModal`: Modal Bento Dashboard toàn màn hình hoặc popup rộng với 5 tab:
    - Tab 1: Tổng quan số liệu (Cards: Chat hôm nay, Explain hôm nay, Tokens, Tỷ lệ từ chối, Cảnh báo hạn mức).
    - Tab 2: Cấu hình runtime (`chat.user_daily_limit`, `chat.global_daily_limit`, `explain.*`, `tags.*`).
    - Tab 3: Quản lý Thẻ (Bật/tắt thẻ hệ thống, xem followers, bảng duyệt yêu cầu thẻ từ người dùng).
    - Tab 4: Quản lý Thành viên (Xem danh sách, tìm kiếm, đổi vai trò `user`/`admin`, khóa/mở khóa tài khoản).
    - Tab 5: Nhật ký Kiểm toán (Bảng lịch sử thao tác của admin).
- Tích hợp UserTagModal: Bổ sung nút/form nhỏ "Đề xuất thẻ mới" gọi `POST /api/tag-requests`.
- HeaderNav: Thêm nút "Quản trị" (Admin badge kèm icon Shield) mở `AdminModal` khi `user?.role === 'admin'`.

- [x] **Step 1: Triển khai API client `apps/web/src/features/admin/api/admin-client.ts`**
- [x] **Step 2: Xây dựng các tab components theo chuẩn Bento Grid, Dark mode, và a11y**
- [x] **Step 3: Xây dựng `AdminModal.tsx` quản lý state chuyển tab và hiển thị dữ liệu**
- [x] **Step 4: Xuất component qua `apps/web/src/features/admin/index.ts`**
- [x] **Step 5: Gắn nút Quản trị vào `HeaderNav.tsx` và tích hợp `AdminModal` vào `HomePage.tsx`**
- [x] **Step 6: Thêm tính năng "Đề xuất thẻ mới" vào `UserTagModal.tsx`**
- [x] **Step 7: Chạy typecheck và lint trên toàn repo**
    - Run: `pnpm typecheck && pnpm lint`

---

### Task 5: Cập Nhật Tài Liệu & Phân Tách Commit Theo Quy Chuẩn Git Flow

**Files:**

- Modify: `DESIGN_PHASE2_AUTH_ADMIN_CHAT.md`
- Modify: `PROJECT_SUMMARY.md`
- Modify: `README.md`

- [x] **Step 1: Cập nhật lộ trình Bước D thành `[Đã hoàn thành]` trong các tài liệu**
- [x] **Step 2: Chạy kiểm thử toàn bộ monorepo trước khi commit (`pnpm test`, `pnpm typecheck`, `pnpm lint`)**
- [x] **Step 3: Tạo commit `feat:` cho phần tính năng**
    - `git add db/ packages/ apps/worker/src/ apps/web/ DESIGN_PHASE2_AUTH_ADMIN_CHAT.md PROJECT_SUMMARY.md README.md`
    - `git commit -m "feat: implement admin dashboard audit log and runtime config management"`
- [x] **Step 4: Tạo commit `test:` riêng biệt cho phần kiểm thử**
    - `git add apps/worker/tests/admin.test.ts`
    - `git commit -m "test: add unit tests for admin role enforcement and audit logging"`
- [x] **Step 5: Đẩy nhánh lên GitHub**
    - `git push -u origin feature/phase2-step-d-admin-dashboard`

