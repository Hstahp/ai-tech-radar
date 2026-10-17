import { useState, useRef, useCallback } from 'react';
import { API_BASE, getAuthHeaders } from '../../../lib/api-config';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
    isError?: boolean;
}

interface ChatResponse {
    answerable: boolean;
    answer: string;
    citations?: string[];
}

const WELCOME_MSG: ChatMessage = {
    role: 'assistant',
    content:
        'Chào bạn! 👋 Tôi là trợ lý AI Radar. Bạn có thể hỏi tôi bất cứ điều gì về các repo, công cụ hoặc bài báo AI trong bản tin hôm nay nhé!',
};

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (customQuestion?: string) => {
        const question = (customQuestion ?? input).trim();
        if (!question || isLoading) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: question }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                credentials: 'include',
                body: JSON.stringify({ question }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = (await res.json()) as { error?: { message?: string } };
                throw new Error(errData?.error?.message ?? `Lỗi ${res.status}`);
            }

            const data = (await res.json()) as ChatResponse;
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.answer,
                    citations: data.citations,
                },
            ]);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại.';
            setMessages((prev) => [...prev, { role: 'assistant', content: msg, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading]);

    const clearChat = useCallback(() => {
        abortRef.current?.abort();
        setMessages([WELCOME_MSG]);
        setInput('');
        setIsLoading(false);
    }, []);

    return { messages, input, setInput, isLoading, sendMessage, clearChat };
}
