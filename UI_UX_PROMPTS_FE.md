# UI/UX CHO FRONTEND — TRANG NGƯỜI DÙNG VÀ TRANG ADMIN

> **Dành cho AI coding agent (Antigravity, Cursor, Claude Code...).**
> Đọc theo thứ tự: `AGENTS.md` (quy tắc code) → `DESIGN_PHASE2_AUTH_ADMIN_CHAT.md` (hành vi và API) → file này (giao diện và trải nghiệm).
> File này gồm **đặc tả** (mục 1–10) và **các prompt sẵn dùng** (mục 11). Có thể dán từng prompt cho agent theo thứ tự.

| | |
| :--- | :--- |
| **Công nghệ hiện có** | Vite + React 19 + Tailwind CSS v4, Lucide icons, Light/Dark mode (`@custom-variant dark`), bố cục Bento Grid |
| **Giữ nguyên** | Bản sắc hiện tại của giao diện (màu, font, Bento Grid, Lucide, không emoji). Đây là chỉnh sửa và mở rộng, **không thiết kế lại từ đầu** |
| **Ngôn ngữ giao diện** | Tiếng Việt |

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

| # | Vấn đề hiện tại | Mục tiêu |
| :--- | :--- | :--- |
| 1 | Giao diện admin đang là **pop-up (modal)** | Khi đăng nhập bằng tài khoản admin, hiển thị **một giao diện quản trị riêng, toàn trang**, chỉ có ở admin. Không dùng modal cho nội dung và biểu mẫu chính |
| 2 | **Tính năng giải thích tin bằng AI** bị lỗi giao diện và chưa đúng ý | Thiết kế lại thành **trang chi tiết mục** có vùng giải thích rõ ràng, đủ các trạng thái, không vỡ bố cục |
| 3 | Chưa có phân tách rõ giữa trải nghiệm người dùng và quản trị | Hai "vỏ" (shell) giao diện độc lập: `UserLayout` và `AdminLayout` |

> **Lưu ý cho agent:** chủ dự án chưa mô tả chi tiết lỗi UI của phần giải thích AI. **Đừng đoán.** Hãy làm bước kiểm tra hiện trạng ở Prompt 1 (mục 11) trước, liệt kê lỗi thật bằng ảnh chụp, rồi mới sửa. Những điểm chưa chắc nằm ở mục 10, kèm mặc định đề xuất.

---

## 2. NGUYÊN TẮC THIẾT KẾ CHUNG

1. **Giữ bản sắc hiện có, thêm có chủ đích.** Dùng lại token màu, font, bo góc đang có trong `styles/`. Chỉ thêm token mới khi thật sự thiếu (mục 3).
2. **Mỗi màn hình có một việc chính.** Mỗi thành phần chỉ làm một việc và đặt tên theo điều người dùng hiểu, không theo cách hệ thống được xây dựng.
3. **Cấu trúc hiển thị là thông tin.** Viền, đường kẻ, nhãn, số thứ tự chỉ xuất hiện khi chúng mang ý nghĩa. Không thêm trang trí cho có.
4. **Tránh các dấu hiệu "giao diện sinh tự động":**
   - nhãn viết hoa toàn bộ, giãn chữ, đặt phía trên mọi tiêu đề;
   - cắt mọi nội dung thành các thẻ giống hệt nhau, cùng một bo góc, cùng một bóng đổ;
   - nền gradient trang trí, mũi tên `→` gắn vào mọi nút, số thứ tự `01 / 02 / 03` khi nội dung không phải là một chuỗi bước;
   - chỉ nhấn mạnh một từ trong tiêu đề bằng màu hoặc in nghiêng;
   - hiệu ứng trượt-và-mờ dần cho mọi khu vực, hiệu ứng hover cho mọi thẻ.
5. **Chuyển động chỉ để phản hồi hành động** (mở, thu gọn, xác nhận) hoặc một khoảnh khắc nhấn mạnh duy nhất. Tôn trọng `prefers-reduced-motion`.
6. **Một điểm nhấn.** Mỗi màn hình chọn một thứ làm điểm nhớ; phần còn lại giữ yên tĩnh và kỷ luật.
7. **Chất lượng nền tảng, không cần tuyên bố:** responsive xuống màn hình điện thoại, focus nhìn thấy được bằng bàn phím, độ tương phản đạt chuẩn, không chỉ dựa vào màu để truyền thông tin.
8. **Dòng chữ dài không vượt khoảng 80 ký tự** (`max-w-prose` hoặc tương đương) cho văn bản đọc.

---

## 3. TOKEN VÀ HỆ THỐNG THÀNH PHẦN

**Dùng lại token đang có.** Chỉ bổ sung những nhóm sau nếu chưa có (đặt trong `styles/`, dạng biến CSS, có giá trị cho cả sáng và tối):

| Nhóm | Tên token gợi ý | Ghi chú |
| :--- | :--- | :--- |
| Bề mặt | `--surface-base`, `--surface-raised`, `--surface-sunken` | Admin dùng nhiều lớp bề mặt hơn (thanh bên, bảng, vùng nhập) |
| Viền, chữ | `--border-subtle`, `--border-strong`, `--text-primary`, `--text-secondary`, `--text-muted` | Đảm bảo tương phản AA cho `--text-muted` trên mọi bề mặt |
| Trạng thái | `--status-success`, `--status-warning`, `--status-danger`, `--status-info`, `--status-neutral` | Luôn kèm **biểu tượng + chữ**, không chỉ màu |
| Bo góc | 2–3 cấp (`--radius-sm`, `--radius-md`, `--radius-lg`) | Phần tử nhỏ dùng cấp nhỏ, thẻ lớn dùng cấp lớn. Không dùng một bo góc cho mọi thứ |
| Khoảng cách | Thang 4px: 4, 8, 12, 16, 24, 32, 48 | Không viết số tùy ý |
| Lớp (z-index) | `--z-header`, `--z-dropdown`, `--z-toast` | Không dùng số `9999` rải rác |
| Cỡ chữ | Thang nhỏ có tên (`text-xs` … `text-2xl`) | Admin dùng cỡ chữ gọn hơn user, nhưng không dưới 14px cho nội dung chính |

**Phân biệt admin và user bằng cấu trúc, không bằng thương hiệu khác.** Admin vẫn cùng họ màu và font, nhưng: bố cục dày đặc hơn, thanh bên cố định, nhãn "Quản trị" cố định ở đầu thanh bên để người dùng luôn biết mình đang ở đâu.

---

## 4. KIẾN TRÚC ĐIỀU HƯỚNG VÀ VỎ GIAO DIỆN

### 4.1. Bản đồ route

| Route | Vỏ | Quyền | Nội dung |
| :--- | :--- | :--- | :--- |
| `/` | `UserLayout` | Công khai | Bản tin mới nhất (Bento Grid) |
| `/day/:date` | `UserLayout` | Công khai | Bản tin theo ngày (nếu đã có) |
| `/item/:key` | `UserLayout` | Công khai xem; giải thích cần đăng nhập | **Trang chi tiết mục** + giải thích AI |
| `/chat` | `UserLayout` | Đăng nhập | Chatbox |
| `/account` | `UserLayout` | Đăng nhập | Tag theo dõi, key riêng (nếu bật), xóa tài khoản |
| `/login` | `AuthLayout` | Công khai | Đăng nhập OAuth |
| `/admin` | `AdminLayout` | **Chỉ admin** | Tổng quan |
| `/admin/keys`, `/admin/keys/new`, `/admin/keys/:id` | `AdminLayout` | Admin | Quản lý API key |
| `/admin/settings` | `AdminLayout` | Admin | Cấu hình và hạn mức |
| `/admin/tags` | `AdminLayout` | Admin | Tag và đề xuất tag |
| `/admin/users`, `/admin/users/:id` | `AdminLayout` | Admin | Người dùng |
| `/admin/content` | `AdminLayout` | Admin | Nội dung, lịch sử pipeline |
| `/admin/chat` | `AdminLayout` | Admin | Rà soát câu hỏi bị từ chối |
| `/admin/audit` | `AdminLayout` | Admin | Nhật ký thao tác |

### 4.2. Quy tắc đăng nhập và chuyển hướng

- Đăng nhập xong: nếu có `returnTo` hợp lệ thì quay lại đó. Nếu **không có `returnTo` và vai trò là `admin`** thì chuyển tới `/admin`. Người dùng thường chuyển tới `/`.
- `returnTo` chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng `/`, không chứa `//` hay giao thức) để tránh chuyển hướng mở.
- Admin vẫn xem được trang người dùng. Ở `UserLayout`, tài khoản admin thấy thêm liên kết "Trang quản trị" trong menu tài khoản. Ở `AdminLayout` luôn có liên kết "Về trang người dùng". **Không ép** admin ở lại một phía.
- Người không phải admin vào `/admin/*`: hiện trang "Bạn không có quyền truy cập khu vực này" (không tiết lộ khu vực có gì) kèm nút về trang chủ. **Server luôn kiểm tra quyền**; guard phía client chỉ để trải nghiệm tốt hơn.
- Chưa đăng nhập vào trang cần quyền: chuyển tới `/login?returnTo=...`.
- Đăng xuất: về `/`.
- **Tách bundle:** toàn bộ `features/admin` dùng `lazy()` để người dùng thường không tải mã admin.

### 4.3. Cấu trúc thư mục (theo `AGENTS.md`)

```
apps/web/src/
├─ app/
│  ├─ router.tsx
│  ├─ guards/             (RequireAuth.tsx, RequireAdmin.tsx)
│  └─ layouts/            (UserLayout.tsx, AdminLayout.tsx, AuthLayout.tsx)
├─ features/
│  ├─ digest/             (trang chủ, Bento Grid, bộ lọc, tìm kiếm)
│  ├─ item-detail/        (ItemDetailPage, ItemHeader, ExplainSection, ExplainStates/…)
│  ├─ chat/
│  ├─ account/            (tag theo dõi, key riêng)
│  ├─ auth/
│  └─ admin/
│     ├─ components/      (AdminSidebar, PageHeader, DataTable, StatCard, StatusBadge,
│     │                    InlineConfirm, SaveBar, FormField, EmptyState)
│     ├─ overview/  keys/  settings/  tags/  users/  content/  chat-review/  audit/
├─ components/ui/         (Button, Badge, Card, Skeleton, Toast, Tooltip, Dropdown…)
├─ lib/                   (copy.ts: chuỗi dùng chung, format…)
└─ styles/
```

Tuân thủ giới hạn kích thước file/component và quy tắc "component hiển thị không tự gọi `fetch`" trong `AGENTS.md`.

---

## 5. GIAO DIỆN NGƯỜI DÙNG (UserLayout)

### 5.1. Khung

```
┌────────────────────────────────────────────────────────────────┐
│ Logo    [ Tìm trong bản tin… ]      Chat   Giao diện   Tài khoản│
├────────────────────────────────────────────────────────────────┤
│ Bản tin 13/10         [Tất cả] [Repo] [Extension] [Tin] [Model] │
│ Đang theo dõi: mcp, agent  (Chỉnh)                              │
│                                                                │
│ ┌─────────────────────┐ ┌──────────┐ ┌──────────┐              │
│ │ Mục nổi bật (lớn)   │ │          │ │          │              │
│ │                     │ └──────────┘ └──────────┘              │
│ └─────────────────────┘ ┌──────────┐ ┌──────────┐              │
│                         └──────────┘ └──────────┘              │
└────────────────────────────────────────────────────────────────┘
```

- **Phân cấp trong Bento Grid:** mục xếp hạng cao nhất có ô lớn hơn; không chia mọi mục thành thẻ giống hệt. Mỗi thẻ cho thấy: loại, tiêu đề, mục đích (tóm tắt ngắn), khuyến nghị (`try_now/watch/skip`), vài thẻ tag, chỉ số chính (ví dụ sao). Liên kết chính trên thẻ dẫn tới **`/item/:key`**; liên kết ra nguồn gốc là hành động phụ.
- **Khuyến nghị (`VerdictBadge`)**: biểu tượng Lucide + chữ ("Thử ngay", "Theo dõi", "Bỏ qua"), màu từ token trạng thái.
- **Bộ lọc loại và tag:** dạng chip có `aria-pressed`; bộ lọc tag cá nhân là bộ lọc phía client. Hiển thị rõ "Đang lọc theo tag của bạn" và cho tắt.
- **Tìm kiếm:** lọc tức thì, có trạng thái "không có kết quả" nêu rõ gợi ý ("Thử bỏ bớt từ khóa hoặc chọn loại khác").
- **Trạng thái bắt buộc cho mọi vùng dữ liệu:** đang tải (skeleton cùng kích thước nội dung thật), lỗi (nêu nguyên nhân và cách xử lý, có nút "Thử lại"), rỗng (mời hành động), có dữ liệu.
- **Dark/Light:** giữ cơ chế `useTheme` hiện có; không được nháy giao diện khi tải trang.

### 5.2. Tài khoản (`/account`)
- Trang riêng, **không phải pop-up**. Hai phần: "Tag theo dõi" (chọn từ danh sách có sẵn, hiện còn bao nhiêu lượt chọn so với giới hạn, nút "Đề xuất tag mới") và "API key của tôi" (chỉ hiện khi tính năng được bật).
- API key: ô nhập dạng mật khẩu, nút "Kiểm tra và lưu", kết quả kiểm tra hiển thị ngay dưới ô nhập. Sau khi lưu chỉ hiển thị 4 ký tự cuối. Nêu rõ **nơi key được lưu** (trình duyệt hay máy chủ). Xóa key bằng xác nhận **ngay tại dòng** (inline), không dùng hộp thoại.

---

## 6. GIAO DIỆN ADMIN (AdminLayout)

### 6.1. Quy tắc cốt lõi

> **Không dùng modal, dialog hay pop-up cho điều hướng, biểu mẫu hoặc nội dung chính của admin.**
> **Được phép:** thông báo nhanh (toast) không chặn thao tác, tooltip, menu thả xuống nhỏ (dropdown), và **xác nhận ngay tại chỗ** (inline confirm).
> Mỗi chức năng là một **trang** có URL riêng (có thể chia sẻ và quay lại bằng nút Back). Tạo và sửa là trang riêng (`/admin/keys/new`, `/admin/keys/:id`), không phải cửa sổ nổi.

Khi tìm thấy modal admin hiện có: thay bằng trang hoặc xác nhận inline tương ứng. **Không xóa thành phần `Modal` dùng chung** nếu nơi khác còn dùng; chỉ gỡ khỏi khu vực admin.

### 6.2. Khung

```
┌────────────┬─────────────────────────────────────────────────────┐
│ AI Radar   │ Quản trị  /  API key                  [Tài khoản ▾] │
│ Quản trị   ├─────────────────────────────────────────────────────┤
│            │ API key hệ thống                      [Thêm API key]│
│ Tổng quan  │ Dùng cho chat và giải thích AI. Key không bao giờ    │
│ API key    │ được hiển thị lại sau khi lưu.                      │
│ Cấu hình   │ ─────────────────────────────────────────────────── │
│ Tag        │  Bộ lọc: [Nhà cung cấp ▾] [Trạng thái ▾]            │
│ Người dùng │ ┌─────────────────────────────────────────────────┐ │
│ Nội dung   │ │ Tên   Nhà cung cấp  Trạng thái  Hôm nay  …      │ │
│ Chat       │ │ …                                               │ │
│ Nhật ký    │ └─────────────────────────────────────────────────┘ │
│ ────────── │                                                     │
│ Về trang   │                                                     │
│ người dùng │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

- **Thanh bên cố định** (từ màn hình ≥ 1024px). Dưới 1024px, thanh bên thu thành thanh trên cùng gọn; menu **mở rộng ngay trong trang** (đẩy nội dung xuống), không phủ lên nội dung.
- **Tiêu đề trang (`PageHeader`)**: tên trang, một câu mô tả việc người dùng làm ở đây, hành động chính ở bên phải (một nút nổi bật duy nhất).
- Mục đang mở trên thanh bên dùng `aria-current="page"`.
- Admin ưu tiên màn hình rộng nhưng **không được vỡ ở máy tính bảng và điện thoại**. Bảng rộng cuộn ngang trong khung riêng, trang không cuộn ngang.

### 6.3. Thành phần dùng chung của admin

| Thành phần | Quy tắc |
| :--- | :--- |
| `DataTable` | Bảng ngữ nghĩa (`<table>`, `<th scope>`), tiêu đề cột cố định khi cuộn, sắp xếp, lọc, phân trang, hàng có hành động, trạng thái tải/rỗng/lỗi. Không nhồi hành động vào menu ẩn nếu chỉ có 1–2 hành động |
| `StatusBadge` | Biểu tượng + chữ + màu. Ví dụ `active` "Đang hoạt động", `cooldown` "Tạm nghỉ đến 14:30", `disabled` "Đã tắt" |
| `InlineConfirm` | Thao tác nguy hiểm: bấm lần 1, nút đổi thành khu xác nhận ngay tại chỗ ("Xóa key này? Không thể hoàn tác." + "Xóa" / "Giữ lại"). Với thao tác rất nặng (xóa người dùng), chuyển sang **trang xác nhận riêng** có yêu cầu gõ lại tên |
| `SaveBar` | Thanh lưu dính ở đáy form: hiện khi có thay đổi chưa lưu, nút "Lưu thay đổi" và "Hoàn tác", cảnh báo khi rời trang có thay đổi chưa lưu |
| `FormField` | Nhãn luôn hiển thị, mô tả ngắn, lỗi gắn với ô nhập (`aria-describedby`), không dùng placeholder thay nhãn |
| `StatCard` | Chỉ dùng cho số liệu thật cần theo dõi (mức dùng so với hạn mức). Không dùng thẻ số liệu trang trí |
| `EmptyState` | Nói rõ chưa có gì và hành động tiếp theo |

### 6.4. Từng màn hình admin

| Màn hình | Nội dung chính | Lưu ý giao diện |
| :--- | :--- | :--- |
| **Tổng quan** | Mức dùng hôm nay so với hạn mức (chat, giải thích), tỷ lệ từ chối, key đang lỗi, lần chạy pipeline gần nhất | Thanh tiến độ có nhãn chữ; cảnh báo khi ≥ 70% hạn mức; liên kết thẳng tới màn hình cần xử lý |
| **API key** | Bảng key: tên, nhà cung cấp, 4 ký tự cuối, trạng thái, mức dùng hôm nay so với `soft_daily_limit`, lỗi gần nhất. Trang thêm/sửa key | Ô nhập key dạng mật khẩu, **không bao giờ hiển thị lại key đầy đủ**; nút "Kiểm tra kết nối" hiển thị kết quả ngay tại chỗ; cảnh báo khi đặt giới hạn mềm cao hơn 70% hạn mức công bố; khối giải thích rủi ro điều khoản ở đầu trang, không phải pop-up |
| **Cấu hình** | Các nhóm: chat, giải thích AI, tag, key. Mỗi mục có giá trị mặc định và mô tả | Biểu mẫu chia nhóm, `SaveBar`, ghi chú "Thay đổi được ghi vào nhật ký" |
| **Tag** | Danh sách tag (bật/tắt, tag hệ thống, số người theo dõi, số tin tối đa) và hàng đợi đề xuất tag | Duyệt hoặc từ chối ngay trên dòng, có ô lý do; hiển thị tổng số tag đang hoạt động so với giới hạn |
| **Người dùng** | Bảng người dùng, trang chi tiết (mức dùng, tag, trạng thái) | Đình chỉ/khôi phục bằng `InlineConfirm` |
| **Nội dung** | Lịch sử chạy pipeline, ẩn một mục | Bảng có trạng thái và thời lượng; ẩn mục bằng thao tác ngay tại hàng |
| **Chat** | Câu hỏi bị từ chối (để chỉnh ngưỡng), tỷ lệ từ chối nhầm | Lọc theo lý do từ chối; cho đánh dấu "từ chối đúng/nhầm" |
| **Nhật ký** | Thao tác nhạy cảm theo thời gian | Chỉ đọc, lọc theo hành động và người thực hiện |

---

## 7. GIẢI THÍCH BẰNG AI — TRANG CHI TIẾT MỤC

### 7.1. Mô hình giao diện
Giải thích không hiện trong pop-up hay mở rộng giữa Bento Grid (làm lệch lưới). Thay vào đó là **trang chi tiết `/item/:key`**:

```
┌────────────────────────────────────────────────────────────────┐
│ ← Về bản tin                                                    │
│ [Repo]  acme/agent-kit                           [Mở trên GitHub]│
│ Thử ngay · TypeScript · 1.840 sao · #agent #devtools            │
│                                                                │
│ Tóm tắt                                                         │
│ Mục đích: …    Điểm nổi bật: …    Gợi ý: …                      │
│ ─────────────────────────────────────────────────────────────── │
│ Giải thích chi tiết                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ (một trong các trạng thái ở mục 7.2)                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ─────────────────────────────────────────────────────────────── │
│ Hỏi về mục này  →  mở /chat với câu hỏi gợi ý đã điền sẵn       │
└────────────────────────────────────────────────────────────────┘
```

- URL chia sẻ được; nút Back hoạt động; tiêu đề tài liệu (`<title>`) theo tên mục.
- Phần "Tóm tắt" hiển thị ngay từ dữ liệu có sẵn (không chờ API giải thích).
- Cột nội dung đọc có độ rộng tối đa khoảng 70–80 ký tự.

### 7.2. Các trạng thái của vùng "Giải thích chi tiết" (bắt buộc làm đủ)

| Trạng thái | Điều kiện | Giao diện |
| :--- | :--- | :--- |
| **Chưa tạo** | Chưa có `explanations` ở trạng thái `ready` | Mô tả 1 câu giá trị ("Giải thích mục này làm gì, cách hoạt động và khi nào nên dùng"), nút chính **"Tạo giải thích"**, dòng phụ "Còn N/M lượt hôm nay" |
| **Chưa đăng nhập** | Người dùng chưa đăng nhập | Nút "Đăng nhập để tạo giải thích", giữ `returnTo` là trang hiện tại |
| **Đang tạo** | Phản hồi `202` hoặc đang chờ | Skeleton có hình dạng giống nội dung cuối, dòng trạng thái "Đang tạo giải thích, thường mất vài giây". Tự kiểm tra lại theo khoảng tăng dần (ví dụ 2s, 3s, 5s), dừng sau khoảng 40 giây và hiện trạng thái "Quá lâu" |
| **Đã có** | `ready` | Hiển thị các phần: Đây là gì, Hoạt động thế nào, Dùng khi nào, Hạn chế, Bắt đầu thế nào. Lần xem này **không trừ lượt** |
| **Độ tin cậy thấp** | `confidence = low` | Ghi chú nhỏ ngay dưới tiêu đề: "Nguồn cung cấp ít thông tin nên giải thích có thể chưa đầy đủ" |
| **Hết lượt** | Quá `explain.user_daily_limit` hoặc hạn mức tổng | Nói rõ lý do và lựa chọn: quay lại vào ngày mai, hoặc thêm key riêng (nếu bật). Không phải thông báo lỗi chung chung |
| **Lỗi** | `failed` hoặc lỗi mạng | Nêu nguyên nhân dễ hiểu và nút "Thử lại"; không hiển thị mã lỗi kỹ thuật thô |
| **Quá tải** | `503` | "Hệ thống đang quá tải. Bạn thử lại sau ít phút." |

Dòng chú thích nhỏ ở cuối phần giải thích: "Do AI tạo từ mô tả và README của dự án. Có thể có sai sót, hãy kiểm tra nguồn gốc." Không lặp lại ở mọi phần.

### 7.3. Danh sách lỗi UI thường gặp phải kiểm tra và sửa

- **Tràn nội dung:** URL, đoạn mã, tên repo dài làm vỡ khung → dùng `overflow-wrap: anywhere`, khối mã cuộn ngang trong khung riêng.
- **Lệch bố cục khi tải xong:** skeleton phải có chiều cao tương đương nội dung thật; dành sẵn chỗ để không nhảy trang.
- **Bấm nhiều lần:** nút bị vô hiệu hóa khi đang gửi; thao tác tạo giải thích có tính lũy đẳng ở server nhưng giao diện vẫn phải chặn.
- **Điều kiện chạy đua:** chuyển sang mục khác khi đang chờ → hủy request cũ bằng `AbortController`, bỏ qua kết quả của mục không còn hiển thị.
- **Rò rỉ vòng kiểm tra lại:** dọn bộ đếm giờ khi rời trang hoặc khi `ready`.
- **Lỗi chồng lớp/cuộn:** không dùng lớp phủ chặn cuộn; nếu có phần tử nổi (dropdown, toast) dùng thang `z-index` của token.
- **Quản lý focus:** khi giải thích xuất hiện, chuyển focus tới tiêu đề vùng giải thích; trạng thái "đang tạo" dùng vùng `aria-live="polite"`.
- **Chế độ tối:** kiểm tra độ tương phản của chữ phụ, viền, khối mã, skeleton.
- **Điện thoại:** dùng `100dvh` thay `100vh`, kiểm tra vùng an toàn (safe-area), vùng chạm tối thiểu 44px, bàn phím ảo không che nút.
- **Chữ Việt:** kiểm tra cắt dòng, chiều cao dòng đủ cho dấu, không cắt chữ bằng `truncate` ở những nơi cần đọc đủ.
- **Lỗi một phần:** đặt `ErrorBoundary` quanh vùng giải thích để lỗi ở đây không làm trắng cả trang.
- **Số lượt còn lại lỗi thời:** làm mới số lượt sau mỗi lần tạo thành công.

---

## 8. CHATBOX (`/chat`)

- Trang riêng, không pop-up. Danh sách tin nhắn, ô nhập ở đáy, hiển thị **lượt còn lại hôm nay**.
- **Câu từ chối** trình bày bình tĩnh, khác với câu trả lời (khung nhạt, biểu tượng thông tin), kèm 2–3 câu hỏi gợi ý bấm được. Không dùng giọng xin lỗi dài dòng.
- **Trích dẫn** hiển thị dưới dạng liên kết tới `/item/:key` (tiêu đề mục), lấy từ dữ liệu đã kiểm tra, không lấy từ chuỗi do AI sinh.
- Trạng thái: đang gửi (nút vô hiệu hóa, chỉ báo đang trả lời), lỗi (nút gửi lại), hết lượt (nêu rõ và gợi ý key riêng), rate limit (nêu thời gian chờ).
- Hỗ trợ gửi bằng Enter, xuống dòng bằng Shift+Enter; giới hạn độ dài với bộ đếm ký tự khi gần chạm giới hạn.
- Vào từ "Hỏi về mục này": điền sẵn câu hỏi gợi ý, **người dùng bấm gửi**, không tự gửi.
- Cuộn: giữ vị trí khi người dùng đang đọc phía trên; chỉ tự cuộn xuống khi họ đang ở cuối.

---

## 9. NGÔN NGỮ GIAO DIỆN (MICROCOPY)

**Quy tắc:** tiếng Việt tự nhiên, viết hoa kiểu câu (chỉ viết hoa chữ đầu), động từ chủ động, mỗi hành động giữ **một tên** xuyên suốt (nút, thông báo, tiêu đề). Lỗi nêu **chuyện gì xảy ra và cách xử lý**, không xin lỗi và không mơ hồ. Trạng thái rỗng là lời mời hành động.

Đặt các chuỗi lặp lại trong `lib/copy.ts` (hoặc cơ chế i18n nếu đã có). Từ vựng chuẩn:

| Ngữ cảnh | Dùng | Không dùng |
| :--- | :--- | :--- |
| Tạo giải thích | "Tạo giải thích" → thông báo "Đã tạo giải thích" | "Submit", "Generate", "Xử lý" |
| Lưu cấu hình | "Lưu thay đổi" → "Đã lưu thay đổi" | "Gửi", "OK" |
| Thêm key | "Thêm API key" → "Đã thêm API key" | "Tạo mới" |
| Vô hiệu hóa key | "Tắt key" → "Đã tắt key" | "Xóa" (nếu chỉ tắt) |
| Xóa | "Xóa" kèm đối tượng ("Xóa key này?") | "Bạn chắc chắn chứ?" trống nghĩa |
| Hết lượt | "Bạn đã dùng hết lượt hôm nay. Lượt mới có từ ngày mai, hoặc bạn có thể thêm API key riêng." | "Quota exceeded", "Lỗi 429" |
| Chưa có dữ liệu | "Chưa có tin phù hợp với bộ lọc. Thử bỏ bớt thẻ lọc." | "Không có dữ liệu" |
| Lỗi mạng | "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." | "Đã xảy ra lỗi" |
| Không có quyền | "Bạn không có quyền truy cập khu vực này." | "Forbidden" |

Không dùng tên kỹ thuật nội bộ (`answerable`, `soft_daily_limit`, `cooldown`) làm nhãn hiển thị. Dùng lời mô tả cho người dùng ("Giới hạn dùng mỗi ngày", "Tạm nghỉ").

---

## 10. QUYẾT ĐỊNH CẦN XÁC NHẬN VỚI CHỦ DỰ ÁN

Nếu chưa được trả lời, **dùng mặc định** nhưng ghi rõ giả định trong mô tả thay đổi.

| Câu hỏi | Mặc định đề xuất |
| :--- | :--- |
| Giải thích AI hiển thị ở đâu: trang chi tiết, mở rộng ngay trên thẻ, hay bảng bên cạnh? | Trang chi tiết `/item/:key` |
| Lỗi UI cụ thể của giải thích AI hiện tại là gì (ảnh chụp, mô tả)? | Chạy kiểm tra hiện trạng (Prompt 1) và liệt kê lỗi thật |
| Admin vào bằng `/admin` hay một tên miền phụ? | `/admin` trong cùng ứng dụng |
| Admin đăng nhập xong tự vào `/admin`? | Có, khi không có `returnTo` |
| Menu điều hướng admin trên điện thoại | Mở rộng ngay trong trang, không lớp phủ |
| Thư viện router, thư viện gọi dữ liệu | Dùng router đang có; nếu chưa có thì React Router. Gợi ý TanStack Query cho cache, thử lại và kiểm tra lại định kỳ. **Nêu lý do và hỏi trước khi thêm dependency** |
| Có cần chế độ xem trước "giao diện người dùng" ngay trong admin không? | Không, chỉ có liên kết "Về trang người dùng" |

---

## 11. CÁC PROMPT SẴN DÙNG (dán lần lượt cho agent)

> Mỗi prompt là một nhánh/PR nhỏ theo `GIT_WORKFLOW.md`, tách commit `test:` khỏi `feat:`/`fix:`. Làm xong prompt trước mới sang prompt sau.

### Prompt 1 — Kiểm tra hiện trạng (chưa sửa code)

```text
Đọc AGENTS.md, DESIGN_PHASE2_AUTH_ADMIN_CHAT.md và UI_UX_PROMPTS_FE.md.
Nhiệm vụ: KIỂM TRA hiện trạng giao diện web, CHƯA sửa code.

1. Chạy ứng dụng. Với mỗi màn hình sau, chụp ảnh ở 3 độ rộng (375, 768, 1280) và cả chế độ sáng/tối:
   trang chủ, giao diện admin hiện tại, tính năng giải thích AI cho một mục tin.
2. Liệt kê TẤT CẢ lỗi UI/UX bạn thấy trong một bảng: màn hình | độ rộng | chế độ | mô tả lỗi | nguyên nhân nghi ngờ (file/dòng) | mức độ.
   Đặc biệt đối chiếu với danh sách ở mục 7.3 của UI_UX_PROMPTS_FE.md.
3. Liệt kê mọi nơi đang dùng modal/dialog/pop-up trong khu vực admin.
4. Đề xuất kế hoạch sửa theo thứ tự ưu tiên và nêu các giả định cần chủ dự án xác nhận (mục 10).
Không thêm dependency, không đổi code. Trả về báo cáo bằng Markdown.
```

### Prompt 2 — Vỏ giao diện, route và phân quyền hiển thị

```text
Triển khai mục 4 của UI_UX_PROMPTS_FE.md:
- Tạo UserLayout, AdminLayout, AuthLayout và router theo bảng route (mục 4.1).
- Tạo guard RequireAuth và RequireAdmin (server vẫn là nơi kiểm tra quyền cuối cùng).
- Quy tắc chuyển hướng sau đăng nhập: có returnTo hợp lệ thì quay lại; không có và là admin thì /admin; còn lại là /.
- returnTo chỉ chấp nhận đường dẫn nội bộ, có test cho trường hợp độc hại (//evil.com, http://..., javascript:).
- Dùng lazy() để tách bundle khu vực admin.
- AdminLayout: thanh bên cố định ≥1024px; dưới 1024px menu mở rộng ngay trong trang (không lớp phủ). Có liên kết "Về trang người dùng" và nhãn "Quản trị".
- UserLayout: menu tài khoản có liên kết "Trang quản trị" khi là admin.
Tiêu chí: người không phải admin vào /admin/* thấy trang "không có quyền"; admin đăng nhập xong vào thẳng /admin;
không còn modal nào trong khu vực admin ở bước này (có thể tạm là trang rỗng cho từng mục).
Viết test cho guard và hàm kiểm tra returnTo.
```

### Prompt 3 — Các trang admin (không pop-up)

```text
Triển khai các màn hình admin theo mục 6 của UI_UX_PROMPTS_FE.md, từng màn hình một (mỗi màn hình một commit riêng):
Tổng quan → API key → Cấu hình → Tag → Người dùng → Nội dung → Chat → Nhật ký.
Quy tắc bắt buộc:
- KHÔNG dùng modal/dialog/pop-up. Tạo/sửa là trang riêng có URL. Xác nhận nguy hiểm dùng InlineConfirm.
- Tạo các thành phần dùng chung trong features/admin/components (DataTable, StatusBadge, InlineConfirm, SaveBar, FormField, PageHeader, EmptyState) trước khi làm màn hình đầu tiên.
- Mỗi bảng/biểu mẫu xử lý đủ 4 trạng thái (tải, lỗi, rỗng, có dữ liệu).
- API key: không bao giờ hiển thị lại key đầy đủ; kiểm tra kết nối hiển thị ngay tại chỗ.
- Chuỗi giao diện lấy từ lib/copy.ts theo mục 9.
- Không thêm dependency khi chưa hỏi.
Dữ liệu: dùng API trong DESIGN_PHASE2_AUTH_ADMIN_CHAT.md. Nếu API chưa có, dùng lớp dữ liệu giả có cùng kiểu (Zod) và ghi rõ chỗ cần thay.
```

### Prompt 4 — Trang chi tiết mục và giải thích AI

```text
Triển khai mục 7 của UI_UX_PROMPTS_FE.md:
- Tạo trang /item/:key với phần "Tóm tắt" (dữ liệu có sẵn) và vùng "Giải thích chi tiết".
- Làm đủ TẤT CẢ trạng thái ở bảng 7.2 (chưa tạo, chưa đăng nhập, đang tạo, đã có, độ tin cậy thấp, hết lượt, lỗi, quá tải).
- Kiểm tra lại định kỳ khi đang tạo (khoảng tăng dần, dừng sau ~40 giây), dọn bộ đếm giờ, hủy request bằng AbortController.
- Sửa các lỗi trong danh sách 7.3 và các lỗi bạn đã ghi ở báo cáo Prompt 1.
- Trên thẻ Bento Grid, liên kết chính dẫn tới /item/:key.
- Đặt ErrorBoundary quanh vùng giải thích; quản lý focus và aria-live.
- Viết test cho từng trạng thái bằng Testing Library (hành vi người dùng nhìn thấy), kể cả chuyển nhanh giữa hai mục.
Tiêu chí: không lệch bố cục khi tải xong, không tràn nội dung, hoạt động tốt ở 375/768/1280 và cả hai chế độ sáng/tối.
```

### Prompt 5 — Hoàn thiện giao diện người dùng

```text
Áp dụng mục 5 và 8 của UI_UX_PROMPTS_FE.md cho UserLayout, Bento Grid, trang /account và /chat:
- Phân cấp thẻ (mục nổi bật lớn hơn), VerdictBadge bằng biểu tượng + chữ, bộ lọc dạng chip có aria-pressed.
- Trạng thái tải/lỗi/rỗng cho mọi vùng dữ liệu; skeleton đúng kích thước.
- /account là trang riêng (tag theo dõi, key riêng nếu bật), xóa key bằng xác nhận tại chỗ.
- /chat: câu từ chối trình bày khác câu trả lời, trích dẫn là liên kết tới /item/:key, hiển thị lượt còn lại.
- Giữ bản sắc hiện tại; chỉ thêm token mới khi thật sự thiếu (mục 3). Tránh các dấu hiệu "giao diện sinh tự động" ở mục 2.4.
- Dùng copy.ts cho chuỗi lặp lại, theo mục 9.
```

### Prompt 6 — Kiểm tra chất lượng cuối (QA)

```text
Chạy checklist ở mục 12 của UI_UX_PROMPTS_FE.md cho toàn bộ ứng dụng.
Với mỗi mục KHÔNG đạt: ghi lại, sửa, và chụp ảnh trước/sau.
Chạy typecheck, lint, test. Báo cáo kết quả theo bảng: mục kiểm tra | kết quả | ghi chú.
Không báo "xong" nếu chưa thực sự chạy; nếu không chạy được thì nói rõ lý do.
```

---

## 12. CHECKLIST QA GIAO DIỆN

**Admin**
- [ ] Đăng nhập bằng tài khoản admin (không có `returnTo`) vào thẳng `/admin`
- [ ] Không còn modal/dialog/pop-up nào trong khu vực admin (tìm cả `role="dialog"`)
- [ ] Mỗi chức năng có URL riêng; nút Back và tải lại trang hoạt động đúng
- [ ] Người không phải admin không vào được `/admin/*` (cả giao diện lẫn API)
- [ ] Key không bao giờ hiển thị đầy đủ (kiểm tra cả DOM, phản hồi mạng, và console)
- [ ] Thao tác nguy hiểm dùng xác nhận tại chỗ; thao tác nặng dùng trang xác nhận riêng
- [ ] Bảng rộng không làm trang cuộn ngang; menu điện thoại không phủ nội dung

**Giải thích AI và chat**
- [ ] Đủ 8 trạng thái ở bảng 7.2, có test
- [ ] Không lệch bố cục khi nội dung xuất hiện; không tràn với URL/mã dài
- [ ] Chuyển nhanh giữa các mục không hiện nhầm giải thích của mục cũ
- [ ] Rời trang khi đang tạo không để lại bộ đếm giờ hay request treo
- [ ] Câu từ chối của chat khác biệt rõ với câu trả lời; trích dẫn mở đúng `/item/:key`

**Chung**
- [ ] Kiểm tra ở 375 / 768 / 1280 và cả chế độ sáng/tối, không nháy giao diện khi tải
- [ ] Điều khiển hoàn toàn bằng bàn phím, focus luôn nhìn thấy, thứ tự Tab hợp lý
- [ ] Độ tương phản đạt AA (kể cả chữ phụ và trạng thái)
- [ ] Trạng thái không truyền đạt chỉ bằng màu
- [ ] `prefers-reduced-motion` được tôn trọng
- [ ] Vùng chạm ≥ 44px trên điện thoại; không bị bàn phím ảo hoặc thanh hệ thống che
- [ ] Mọi vùng dữ liệu có đủ trạng thái tải/lỗi/rỗng/có dữ liệu
- [ ] Chuỗi giao diện nhất quán, lấy từ `lib/copy.ts`
- [ ] `typecheck`, `lint`, `test` đều qua; không thêm dependency ngoài thỏa thuận

---

## 13. ĐIỀU KHÔNG ĐƯỢC LÀM

1. Không dùng modal/pop-up cho nội dung hoặc biểu mẫu của admin.
2. Không thiết kế lại toàn bộ bản sắc giao diện khi chỉ được yêu cầu chỉnh khu vực cụ thể.
3. Không để người dùng thường tải mã của khu vực admin.
4. Không dựa vào ẩn/hiện ở giao diện để bảo mật; mọi quyền phải được server kiểm tra.
5. Không hiển thị lại API key đầy đủ ở bất kỳ đâu.
6. Không dùng màu làm cách duy nhất để truyền thông tin trạng thái.
7. Không dùng nhãn viết hoa toàn bộ, gradient trang trí, hiệu ứng hover cho mọi thẻ, hay emoji thay biểu tượng.
8. Không để component hiển thị tự gọi `fetch` hoặc tự đọc `localStorage` ngoài hook đã quy định.
9. Không thêm dependency, không thêm quy tắc mới mà không nêu lý do và hỏi trước.
10. Không báo hoàn thành khi chưa chạy kiểm tra và chưa xem giao diện thực ở các độ rộng đã nêu.
