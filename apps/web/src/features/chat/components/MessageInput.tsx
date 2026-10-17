import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
    input: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
}

export function MessageInput({ input, onChange, onSend, isLoading }: MessageInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSend();
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-b-2xl flex items-center gap-2"
        >
            <input
                type="text"
                value={input}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về tin tức, công cụ AI trong ngày..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            />
            <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Gửi tin nhắn"
                className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all duration-200 cursor-pointer"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4 translate-x-0.5" />
                )}
            </button>
        </form>
    );
}
