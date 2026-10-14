import { PageHeader } from '../components/PageHeader';
import { AdminAuditTab } from '../components/AdminAuditTab';

export function AdminAuditPage() {
  return (
    <div>
      <PageHeader
        title="Nhật ký kiểm toán (Audit Log)"
        description="Lịch sử chi tiết các hoạt động điều chỉnh cấu hình và can thiệp quản trị"
      />
      <AdminAuditTab />
    </div>
  );
}
