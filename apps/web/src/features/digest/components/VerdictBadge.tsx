import { Zap, Eye, FastForward } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import type { Verdict } from "../../../types";

interface VerdictBadgeProps {
  verdict?: Verdict | null;
  className?: string;
}

export function VerdictBadge({ verdict, className }: VerdictBadgeProps) {
  if (!verdict) return null;

  switch (verdict) {
    case "try_now":
      return (
        <Badge variant="success" className={className}>
          <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
          <span>Thử ngay</span>
        </Badge>
      );
    case "watch":
      return (
        <Badge variant="warning" className={className}>
          <Eye className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span>Theo dõi</span>
        </Badge>
      );
    case "skip":
      return (
        <Badge variant="default" className={className}>
          <FastForward className="h-3 w-3 text-slate-500 dark:text-slate-400" />
          <span>Bỏ qua</span>
        </Badge>
      );
  }
}
