import { Bookmark } from 'lucide-react';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  className?: string;
  showText?: boolean;
}

export function BookmarkButton({
  isBookmarked,
  onToggle,
  size = 'md',
  className = '',
  showText = false,
}: BookmarkButtonProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const padding = showText
    ? size === 'sm'
      ? 'px-2.5 py-1'
      : 'px-3 py-1.5'
    : size === 'sm'
    ? 'p-1.5'
    : 'p-2';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(e);
      }}
      aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
      title={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
      className={`inline-flex items-center gap-1.5 rounded-xl transition-all duration-150 cursor-pointer ${padding} ${
        isBookmarked
          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 dark:border-amber-400/30'
          : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/50'
      } ${className}`}
    >
      <Bookmark
        className={`${iconSize} transition-transform active:scale-90 ${
          isBookmarked ? 'fill-current' : ''
        }`}
      />
      {showText && (
        <span className="text-xs font-semibold">
          {isBookmarked ? 'Đã lưu' : 'Lưu bài'}
        </span>
      )}
    </button>
  );
}
