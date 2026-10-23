import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-4">
                {icon || <Inbox className="h-6 w-6" />}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">{description}</p>
            {actionLabel && onAction && (
                <Button variant="secondary" size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
