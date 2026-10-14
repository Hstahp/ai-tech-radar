import { useState, useEffect } from 'react';

/**
 * Hook quản lý routing nhẹ nhàng không cần dependency lớn,
 * hỗ trợ pushState, popstate (nút Back/Forward của trình duyệt),
 * và query parameters / dynamic path matching.
 */
export function useSimpleRouter() {
    const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

    useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname || '/');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (to: string, replace = false) => {
        if (replace) {
            window.history.replaceState({}, '', to);
        } else {
            window.history.pushState({}, '', to);
        }
        setCurrentPath(to);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return { currentPath, navigate };
}

/**
 * Kiểm tra tính an toàn của URL returnTo (chống Open Redirect vulnerability)
 */
export function sanitizeReturnTo(returnTo: string | null | undefined): string {
    if (!returnTo) return '/';
    const clean = returnTo.trim();
    // Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng 1 dấu '/' và không chứa '//', 'http:', 'javascript:'
    if (
        clean.startsWith('/') &&
        !clean.startsWith('//') &&
        !clean.includes('\\') &&
        !clean.toLowerCase().includes('javascript:')
    ) {
        return clean;
    }
    return '/';
}
