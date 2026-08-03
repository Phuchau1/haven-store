/**
 * Utility client-side cho Analytics Tracking
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fashion-backend-93lh.onrender.com';

function getSessionId() {
    if (typeof window === 'undefined') return '';
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `sess-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
        localStorage.getItem('analytics_session_id');
        localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

export function trackEvent(eventType: string, metadata: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;

    try {
        const userId = localStorage.getItem('userId') || localStorage.getItem('x-user-id') || null;
        const sessionId = getSessionId();

        const payload = {
            eventType,
            page: window.location.pathname + window.location.search,
            userId,
            sessionId,
            metadata
        };

        // Dùng navigator.sendBeacon nếu có để tránh bị hủy khi đổi trang
        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(`${API_BASE_URL}/api/analytics/track`, blob);
        } else {
            fetch(`${API_BASE_URL}/api/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(() => {});
        }
    } catch (e) {
        // Ignore analytics tracking errors
    }
}

export function trackPageView(pageName?: string) {
    trackEvent('page_view', { pageName });
}
