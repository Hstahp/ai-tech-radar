import { useEffect, useRef } from 'react';
import { Bot, User, AlertCircle, Bookmark } from 'lucide-react';
import type { ChatMessage } from '../hooks/useChat';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                    <div
                        key={index}
                        className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                        {!isUser && (
                            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                                <Bot className="h-4 w-4" />
                            </div>
                        )}

                        <div
                            className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                                isUser
                                    ? 'bg-indigo-600 text-white rounded-br-xs'
                                    : msg.isError
                                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60 rounded-bl-xs'
                                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-bl-xs'
                            }`}
                        >
                            {msg.isError && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mb-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>Lỗi</span>
                                </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            {/* Citations badges */}
                            {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                        <Bookmark className="h-3 w-3 text-indigo-500" />
                                        Nguồn:
                                    </span>
                                    {msg.citations.map((cite, cIdx) => (
                                        <span
                                            key={cIdx}
                                            className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30"
                                        >
                                            {cite}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isUser && (
                            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                                <User className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Typing indicator */}
            {isLoading && (
                <div className="flex gap-2.5 justify-start">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
