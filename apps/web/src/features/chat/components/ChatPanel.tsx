import { useState } from 'react';
import { MessageSquare, X, Trash2, Bot, Sparkles, Lock, Loader2 } from 'lucide-react';
import type { UserProfile } from '@radar/core';
import { useAuth } from '../../auth';
import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export interface ChatPanelProps {
    user?: UserProfile | null;
    isAuthLoading?: boolean;
    onLogin?: () => void;
}

export function ChatPanel(props: ChatPanelProps) {
    const auth = useAuth();
    const user = props.user !== undefined ? props.user : auth.user;
    const isAuthLoading = props.isAuthLoading !== undefined ? props.isAuthLoading : auth.isLoading;
    const onLogin = props.onLogin ?? auth.loginWithGoogle;

    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, setInput, isLoading, sendMessage, clearChat } = useChat();

    return (
        <aside aria-label="Khung trò chuyện Trợ lý AI Radar" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window Panel */}
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Cửa sổ hội thoại với Trợ lý AI"
                    className="mb-3 w-[calc(100vw-3rem)] sm:w-96 h-[480px] max-h-[75vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Trợ lý AI Radar
                                    </h2>
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" title="Trực tuyến" />
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                                    {user ? (user.displayName || user.email) : 'Hỏi đáp dựa trên tin hôm nay'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {user && (
                                <button
                                    type="button"
                                    onClick={clearChat}
                                    title="Xóa lịch sử trò chuyện"
                                    aria-label="Xóa lịch sử trò chuyện"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                title="Đóng cửa sổ chat"
                                aria-label="Đóng cửa sổ chat"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body or Login Gate */}
                    {isAuthLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
                            <p className="text-xs text-slate-400">Đang kiểm tra đăng nhập...</p>
                        </div>
                    ) : !user ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
                                <Lock className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                                Đăng nhập để Chat cùng AI
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-[260px] leading-relaxed">
                                Trợ lý AI sử dụng RAG để giải đáp và phân tích các công cụ, mô hình AI trong bản tin hôm nay. Vui lòng đăng nhập bằng Google để bắt đầu.
                            </p>
                            <button
                                type="button"
                                onClick={onLogin}
                                className="w-full max-w-[240px] flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm hover:shadow transition-all cursor-pointer"
                            >
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Đăng nhập với Google
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages Body */}
                            <MessageList messages={messages} isLoading={isLoading} />

                            {/* Input Footer */}
                            <MessageInput
                                input={input}
                                onChange={setInput}
                                onSend={sendMessage}
                                isLoading={isLoading}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Floating Bubble Button (FAB) */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? 'Đóng chat AI' : 'Mở chat AI Tech Radar'}
                className="relative h-13 w-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
                {isOpen ? (
                    <X className="h-6 w-6 transition-transform duration-200 rotate-0" />
                ) : (
                    <>
                        <MessageSquare className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 flex items-center justify-center">
                            <Sparkles className="h-2 w-2 text-white" />
                        </span>
                    </>
                )}
            </button>
        </aside>
    );
}
