import { PageHeader } from '../components/PageHeader';
import { AdminOverviewTab } from '../components/AdminOverviewTab';

export function AdminOverviewPage() {
    return (
        <div>
            <PageHeader
                title="Tổng quan hệ thống"
                description="Theo dõi lưu lượng sử dụng, số lượng người dùng hoạt động và trạng thái bộ nhớ đệm"
            />
            <AdminOverviewTab />
        </div>
    );
}
