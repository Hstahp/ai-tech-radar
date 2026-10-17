import { useState } from 'react';
import { MessageSquare, X, Trash2, Bot, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatPanel() {
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
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Hỏi đáp dựa trên tin hôm nay
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={clearChat}
                                title="Xóa lịch sử trò chuyện"
                                aria-label="Xóa lịch sử trò chuyện"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
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

                    {/* Messages Body */}
                    <MessageList messages={messages} isLoading={isLoading} />

                    {/* Input Footer */}
                    <MessageInput
                        input={input}
                        onChange={setInput}
                        onSend={sendMessage}
                        isLoading={isLoading}
                    />
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
