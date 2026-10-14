import { PageHeader } from '../components/PageHeader';
import { AdminSettingsTab } from '../components/AdminSettingsTab';

export function AdminSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Điều chỉnh hạn mức người dùng, cấu hình mô hình LLM và bảo mật Turnstile"
      />
      <AdminSettingsTab />
    </div>
  );
}
