import { FolderGit2, Puzzle, Newspaper, Cpu, FileText, Bookmark } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import type { Category } from "../../../types";

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const renderIcon = () => {
    switch (category) {
      case "repo":
        return <FolderGit2 className="h-3 w-3 text-indigo-400" />;
      case "extension":
        return <Puzzle className="h-3 w-3 text-indigo-400" />;
      case "news":
        return <Newspaper className="h-3 w-3 text-indigo-400" />;
      case "model":
        return <Cpu className="h-3 w-3 text-indigo-400" />;
      case "paper":
        return <FileText className="h-3 w-3 text-indigo-400" />;
      default:
        return <Bookmark className="h-3 w-3 text-indigo-400" />;
    }
  };

  const getLabel = () => {
    switch (category) {
      case "repo":
        return "Repository";
      case "extension":
        return "Extension";
      case "news":
        return "Tin nóng";
      case "model":
        return "Model";
      case "paper":
        return "Paper";
      default:
        return category;
    }
  };

  return (
    <Badge variant="info" className={className}>
      {renderIcon()}
      <span>{getLabel()}</span>
    </Badge>
  );
}
