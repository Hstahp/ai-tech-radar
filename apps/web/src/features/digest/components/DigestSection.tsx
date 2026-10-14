import { Inbox } from "lucide-react";
import { DigestCard } from "./DigestCard";
import type { DigestFeedItem } from "../../../types";

interface DigestSectionProps {
  items: DigestFeedItem[];
  onNavigateToDetail?: (key: string) => void;
}

export function DigestSection({ items, onNavigateToDetail }: DigestSectionProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <Inbox className="h-10 w-10 text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">Không tìm thấy mục nào</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác để xem thêm nội dung.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Danh sách mục công nghệ" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <DigestCard
          key={`${item.item_id}-${item.digest_date}`}
          item={item}
          isFeatured={index === 0}
          onNavigateToDetail={onNavigateToDetail}
        />
      ))}
    </section>
  );
}
