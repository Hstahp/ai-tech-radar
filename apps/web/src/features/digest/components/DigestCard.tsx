import { useState } from 'react';
import { Target, Sparkles, Compass, Code2, Star, ExternalLink } from 'lucide-react';
import { BentoCard } from '../../../components/ui/BentoCard';
import { VerdictBadge } from './VerdictBadge';
import { CategoryBadge } from './CategoryBadge';
import { DeepExplainModal } from '../../explain/components/DeepExplainModal';
import type { DigestFeedItem } from '../../../types';

interface DigestCardProps {
    item: DigestFeedItem;
    isFeatured?: boolean;
}

export function DigestCard({ item, isFeatured = false }: DigestCardProps) {
    const [isExplainOpen, setIsExplainOpen] = useState(false);

    const tagsList = item.tags
        ? item.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
        : [];

    const scoreDisplay = item.score ? Math.round(item.score * 100) : null;

    return (
        <BentoCard isFeatured={isFeatured}>
            <div>
                {/* Header badges & metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <CategoryBadge category={item.category} />
                        <VerdictBadge verdict={item.verdict} />
                    </div>
                    {scoreDisplay !== null && (
                        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                            <span className="text-slate-400">Score:</span>
                            <span className="text-indigo-400">{scoreDisplay}</span>
                        </div>
                    )}
                </div>

                {/* Title & Link */}
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded inline-flex items-center gap-1.5"
                    >
                        <span>{item.title}</span>
                    </a>
                </h3>

                {/* Language / stars if available */}
                {(item.language || item.stars) && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                        {item.language && (
                            <span className="inline-flex items-center gap-1">
                                <Code2 className="h-3 w-3 text-slate-400" />
                                <span>{item.language}</span>
                            </span>
                        )}
                        {item.stars && (
                            <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                                <span>{item.stars.toLocaleString()}</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Content points */}
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {item.purpose && (
                        <div className="flex items-start gap-2.5">
                            <Target className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                            <p className="line-clamp-2 leading-relaxed text-slate-200">{item.purpose}</p>
                        </div>
                    )}

                    {item.highlight && (
                        <div className="flex items-start gap-2.5">
                            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="line-clamp-2 leading-relaxed text-slate-300/90">{item.highlight}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer: action & tags */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-3">
                {item.action && (
                    <div className="text-xs text-indigo-300/90 flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="font-medium truncate">{item.action}</span>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        {tagsList.map((tag) => (
                            <span
                                key={tag}
                                className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsExplainOpen(true)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all shadow-sm hover:shadow-indigo-500/10 cursor-pointer"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Giải thích AI</span>
                        </button>

                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                            <span>Chi tiết</span>
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </div>

            <DeepExplainModal item={item} isOpen={isExplainOpen} onClose={() => setIsExplainOpen(false)} />
        </BentoCard>
    );
}
