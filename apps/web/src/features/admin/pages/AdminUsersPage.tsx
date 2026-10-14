import { PageHeader } from '../components/PageHeader';
import { AdminUsersTab } from '../components/AdminUsersTab';

export function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="Quản lý Người dùng"
        description="Tra cứu tài khoản, cập nhật vai trò quản trị viên và xử lý tạm khóa tài khoản vi phạm"
      />
      <AdminUsersTab />
    </div>
  );
}
