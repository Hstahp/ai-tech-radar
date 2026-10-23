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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm shadow-xs dark:shadow-none transition-colors">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4 ring-1 ring-slate-200/80 dark:ring-slate-700/50">
          <Inbox className="h-7 w-7 text-slate-500 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Không tìm thấy mục nào
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
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
