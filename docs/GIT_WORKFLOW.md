# QUY ĐỊNH CHIA NHÁNH VÀ COMMIT CODE (GIT WORKFLOW)

> **LƯU Ý BẮT BUỘC:** Tài liệu này là quy chuẩn chính thức của dự án cho việc tạo nhánh (branch) và viết commit message.
> Mọi lập trình viên và **AI coding agent** (Antigravity, Cursor, Claude Code, Copilot...) bắt buộc phải tuân thủ nghiêm ngặt các quy tắc trong tài liệu này trước và trong quá trình commit hoặc tạo nhánh và commit và tạo nhánh toàn bộ phải bằng tiếng anh.

---

## 1. QUY ĐỊNH CHIA NHÁNH (BRANCHING CONVENTIONS)

Hệ thống nhánh tuân theo mô hình Git Flow rút gọn bao gồm các nhánh chính và nhánh phụ:

| Tên nhánh     | Mục đích                                 | Nguồn tạo nhánh | Merge vào | Cho phép commit trực tiếp?  |
| :------------ | :--------------------------------------- | :-------------- | :-------- | :-------------------------- |
| `main`        | Production-ready, code ổn định tuyệt đối | -               | -         | ❌ **KHÔNG**                |
| `develop`     | Nhánh phát triển chính, tích hợp & test  | `main`          | `main`    | ❌ **KHÔNG** (thông qua PR) |
| `feature/xxx` | Phát triển tính năng mới                 | `develop`       | `develop` | ✅ (trên nhánh này)         |
| `defect/xxx`  | Sửa lỗi (bug / defect)                   | `develop`       | `develop` | ✅ (trên nhánh này)         |
| `data`        | Lưu trữ dữ liệu xuất bản (orphan)        | -               | -         | 🤖 Chỉ bot GitHub Actions   |

---

### Chi tiết từng loại nhánh

#### 1. `main`

- **Mục đích:** Chứa mã nguồn ổn định nhất, sẵn sàng triển khai môi trường production.
- **Quy tắc:**
  - Chỉ merge từ `develop`.
  - Tuyệt đối **không commit trực tiếp** lên nhánh `main`.

#### 2. `develop`

- **Mục đích:** Nhánh phát triển chính (main development branch).
- **Quy tắc:**
  - Merge từ các nhánh `feature/*` hoặc `defect/*` thông qua Pull Request (PR).
  - Dùng để test tích hợp toàn diện trước khi release lên `main`.
  - Hạn chế commit trực tiếp; mọi thay đổi lớn hay tính năng mới phải đi qua nhánh riêng.

#### 3. `feature/xxx`

- **Mục đích:** Dành riêng để phát triển tính năng mới.
- **Đặt tên nhánh:** `feature/<ten-tinh-nang>` (dùng chữ thường, phân cách bằng dấu gạch ngang `-`).
  - _Ví dụ:_ `feature/authentication`, `feature/github-search-source`, `feature/digest-ui`
- **Quy trình:**
  - Tạo nhánh từ `develop`.
  - Sau khi hoàn thành và vượt qua kiểm tra (typecheck, lint, test) → tạo **Pull Request** vào `develop`.

#### 4. `defect/xxx`

- **Mục đích:** Dành riêng để sửa lỗi (defect / bug fix).
- **Đặt tên nhánh:** `defect/<ten-loi>` (dùng chữ thường, phân cách bằng dấu gạch ngang `-`).
  - _Ví dụ:_ `defect/login-bug`, `defect/token-validation`, `defect/sqlite-foreign-key-error`
- **Quy trình:**
  - Tạo nhánh từ `develop`.
  - Sau khi sửa lỗi và viết test hồi quy → tạo **Pull Request** vào `develop`.

#### 5. `data` (Nhánh dữ liệu Orphan)

- **Mục đích:** Lưu trữ độc lập toàn bộ dữ liệu xuất bản (`latest.json`, `YYYY-MM-DD.json`, `feed.xml`, `search-index.json`).
- **Quy tắc:**
  - Là nhánh độc lập (orphan), không chứa mã nguồn ứng dụng, không merge vào `develop` hay `main`.
  - **Tuyệt đối không sửa tay:** Chỉ workflow GitHub Actions (`daily-pipeline.yml`) tự động cập nhật với tiền tố `chore(data):`.
  - **Khôi phục dữ liệu:** Nếu nhánh `data` gặp sự cố, có thể tạo lại từ file SQLite trong GitHub Release `data-latest`:
    ```bash
    pnpm --filter @radar/pipeline run run -- --db data/radar.db --export data/export --skip-llm
    ```

---

## 2. QUY CHUẨN COMMIT MESSAGE (COMMIT CONVENTIONS)

Mọi commit bắt buộc phải áp dụng định dạng:

```text
<type>: <short description>
```

### 2.1. Quy ước các `type`:

| Type       | Ý nghĩa           | Khi nào sử dụng                                                             |
| :--------- | :---------------- | :-------------------------------------------------------------------------- |
| `feat`     | Thêm tính năng    | Khi thêm một chức năng, API endpoint, component hoặc nguồn dữ liệu mới      |
| `fix`      | Sửa lỗi           | Khi sửa một lỗi logic, crash, validate sai hoặc bug phát sinh               |
| `docs`     | Tài liệu          | Khi cập nhật README, tài liệu hướng dẫn, ghi chú kiến trúc hoặc quy tắc     |
| `refactor` | Tối ưu code       | Tái cấu trúc, làm sạch mã nguồn mà không làm thay đổi tính năng hay sửa lỗi |
| `test`     | Viết test         | Khi thêm unit test, integration test, mock data hoặc cập nhật test cases    |
| `chore`    | Config, build, CI | Cập nhật cấu hình build, dependencies, workflow GitHub Actions, linter      |

### 2.2. Ví dụ mẫu:

- `feat: implement JWT authentication`
- `fix: resolve token validation bug`
- `docs: add git workflow and branching guideline`
- `refactor: optimize database query in items repo`
- `test: add unit tests for url normalization`
- `chore: update pnpm dependencies and vitest config`

### 2.3. Nguyên tắc khi viết commit message:

1. **Một commit một ý:** Nội dung mô tả rõ ràng, nguyên tử (atomic commit). Không gom quá nhiều thay đổi không liên quan vào cùng 1 commit.
2. **Tách riêng commit `test:` và `feat:`:** Các file test (`tests/*.test.ts`) bắt buộc phải commit riêng biệt với type `test:`. Tuyệt đối không commit chung file test vào cùng commit với code tính năng (`feat:`).
3. **Không dùng commit mơ hồ:** Tuyệt đối tránh các commit như `update`, `fix bug`, `temp`, `wip`, `test1`.
4. **Chữ thường cho type và toàn bộ bằng tiếng Anh:** Viết đúng `feat:`, `fix:`, `test:`, ... có dấu hai chấm và một khoảng trắng phía sau. Nội dung commit message và tên nhánh bắt buộc bằng tiếng Anh.
5. **Không commit file nhạy cảm và rác:** Không bao giờ commit file `.env`, khóa API, file database local (`data/*.db*`), file build `dist/`, thư mục tạm.

---

## 3. QUY TRÌNH THỰC HIỆN CHUẨN (WORKFLOW GUIDE)

### Bước 1: Đồng bộ mã nguồn từ nhánh `develop`

```bash
git checkout develop
git pull origin develop
```

### Bước 2: Tạo nhánh mới theo loại công việc

- **Nếu làm tính năng mới:**
  ```bash
  git checkout -b feature/<ten-tinh-nang>
  # Ví dụ: git checkout -b feature/authentication
  ```
- **Nếu sửa lỗi:**
  ```bash
  git checkout -b defect/<ten-loi>
  # Ví dụ: git checkout -b defect/login-bug
  ```

### Bước 3: Thực hiện thay đổi & commit đúng cú pháp

```bash
git add <cac-file-thay-doi>
git commit -m "<type>: <short description>"
# Ví dụ: git commit -m "feat: implement JWT authentication"
```

### Bước 4: Kiểm tra trước khi đẩy code (Definition of Done)

Trước khi push hoặc báo hoàn tất:

- Chạy `pnpm typecheck` (nếu có)
- Chạy `pnpm lint` (nếu có)
- Chạy `pnpm test` (nếu có)

### Bước 5: Đẩy nhánh lên remote & tạo Pull Request

```bash
git push -u origin feature/<ten-tinh-nang>
```

Mở Pull Request vào nhánh **`develop`** để review và merge.
Sau khi nhánh `develop` được kiểm thử tích hợp đầy đủ và sẵn sàng phát hành, sẽ tạo PR từ **`develop`** vào **`main`**.

---

## 4. QUY ĐỊNH DÀNH RIÊNG CHO AI AGENT

Khi AI nhận lệnh thực hiện công việc:

1. **Kiểm tra nhánh hiện tại:** Xác định rõ đang ở nhánh nào. Nếu đang ở `main` hoặc `develop`, hãy tạo nhánh `feature/*` hoặc `defect/*` phù hợp trước khi chỉnh sửa.
2. **Viết commit message:** Luôn đối chiếu danh sách `type` ở Mục 2.1 và đảm bảo thông điệp commit tuân thủ đúng định dạng `<type>: <short description>` bằng tiếng Anh.
3. **Bắt buộc tách riêng commit test:** Khi viết test hoặc sửa test, phải commit riêng với type `test:`. Không bao giờ gộp file test chung vào commit `feat:` hay `refactor:`. Luôn chia nhỏ thành các commit nguyên tử (atomic commits).
