import { PageHeader } from '../components/PageHeader';
import { AdminTagsTab } from '../components/AdminTagsTab';

export function AdminTagsPage() {
  return (
    <div>
      <PageHeader
        title="Quản lý Thẻ chủ đề (Tags)"
        description="Bật/tắt thẻ xuất bản, phê duyệt hoặc từ chối các đề xuất thẻ mới từ cộng đồng"
      />
      <AdminTagsTab />
    </div>
  );
}
