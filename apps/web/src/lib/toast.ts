/**
 * Wrapper nhẹ quanh react-hot-toast để thống nhất cấu hình toàn app.
 * Import `toast` từ file này thay vì từ 'react-hot-toast' trực tiếp.
 */
import toast from 'react-hot-toast';

export { toast };

export const notify = {
    success: (msg: string) =>
        toast.success(msg, {
            duration: 3500,
            style: {
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '13px',
            },
            iconTheme: {
                primary: '#6366f1',
                secondary: '#e0e7ff',
            },
        }),

    error: (msg: string) =>
        toast.error(msg, {
            duration: 4500,
            style: {
                background: '#0f172a',
                color: '#fca5a5',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '13px',
            },
            iconTheme: {
                primary: '#f87171',
                secondary: '#fef2f2',
            },
        }),

    info: (msg: string) =>
        toast(msg, {
            duration: 3000,
            style: {
                background: '#0f172a',
                color: '#cbd5e1',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '13px',
            },
        }),
};
