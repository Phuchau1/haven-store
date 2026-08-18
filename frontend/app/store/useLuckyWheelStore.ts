import { create } from 'zustand';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fashion-backend-93lh.onrender.com';

export interface WheelPrize {
    id: number | string;
    _id?: string;
    label: string;
    reward?: string;
    shortLabel?: string;
    type: 'none' | 'fixed' | 'percent' | 'shipping' | 'voucher' | 'freeship' | 'retry';
    discount_value?: number;
    coupon_code?: string;
    valid_hours?: number;
    value?: number | string;
    code?: string;
    color: string;
    textColor?: string;
    emoji?: string;
    probability?: number;
    active?: boolean;
}

export interface WheelConfig {
    isActive: boolean;
    startDate?: string | null;
    endDate?: string | null;
    resetInterval?: 'daily' | 'weekly' | 'monthly';
    spinsPerPeriod?: number;
    maxSpinsPerAccount?: number;
    maxSpinsPerIP?: number;
    maxSpinsPerDevice?: number;
    onlyNewMembers?: boolean;
    requireLogin?: boolean;
    showProbability?: boolean;
    prizes: WheelPrize[];
}

export interface SpinRewardRecord {
    _id: string;
    reward_text: string;
    spin_date: string;
    voucher_id?: {
        coupon_code?: string;
        discount_value?: number;
        expires_at?: string;
    } | string | null;
}

interface LuckyWheelStore {
    isOpen: boolean;
    activeTab: 'wheel' | 'history';
    config: WheelConfig | null;
    canSpin: boolean;
    remainingSpins: number;
    maxSpins: number;
    usedSpins: number;
    isLoggedIn: boolean;
    requireLogin: boolean;
    nextSpinAt: string | null;
    statusReason: string | null;
    statusMessage: string | null;
    wonPrize: WheelPrize | null;
    recentRewards: SpinRewardRecord[];
    isLoadingCheck: boolean;

    setActiveTab: (tab: 'wheel' | 'history') => void;
    setConfig: (config: WheelConfig) => void;
    openWheel: () => void;
    closeWheel: () => void;
    recordSpin: (prize: WheelPrize, newRemaining?: number) => void;
    clearPrize: () => void;
    checkCanSpin: (userId?: string, token?: string | null) => Promise<void>;
    getTimeUntilNextSpin: () => string;
}

export const useLuckyWheelStore = create<LuckyWheelStore>()(
    (set, get) => ({
        isOpen: false,
        activeTab: 'wheel',
        config: null,
        canSpin: false,
        remainingSpins: 0,
        maxSpins: 2,
        usedSpins: 0,
        isLoggedIn: false,
        requireLogin: true,
        nextSpinAt: null,
        statusReason: null,
        statusMessage: null,
        wonPrize: null,
        recentRewards: [],
        isLoadingCheck: true,

        setActiveTab: (tab) => set({ activeTab: tab }),

        setConfig: (config) => set({ 
            config,
            maxSpins: config.spinsPerPeriod || 2,
            requireLogin: config.requireLogin !== false
        }),

        openWheel: () => set({ isOpen: true, activeTab: 'wheel' }),
        closeWheel: () => set({ isOpen: false }),

        recordSpin: (prize, newRemaining) => {
            const currentRem = get().remainingSpins;
            const updatedRem = typeof newRemaining === 'number' ? newRemaining : Math.max(0, currentRem - 1);
            const updatedUsed = get().usedSpins + 1;
            set({ 
                wonPrize: prize, 
                canSpin: updatedRem > 0,
                remainingSpins: updatedRem,
                usedSpins: updatedUsed,
            });
        },

        clearPrize: () => set({ wonPrize: null }),

        checkCanSpin: async (userId?: string, token?: string | null) => {
            set({ isLoadingCheck: true });
            try {
                const deviceId = typeof window !== 'undefined' ? (localStorage.getItem('device_id') || 'web-client') : 'web-client';
                const headers: Record<string, string> = {
                    'x-device-id': deviceId
                };
                if (token) {
                    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                }
                if (userId) {
                    headers['x-user-id'] = userId;
                }

                const params = new URLSearchParams();
                if (userId) params.append('user_id', userId);
                params.append('device_id', deviceId);

                const endpoint = `${BACKEND_URL.replace(/\/$/, '')}/api/lucky-wheel/can-spin?${params.toString()}`;
                const res = await fetch(endpoint, { headers });
                const data = await res.json();
                
                if (data.success !== undefined) {
                    const max = data.maxSpins || get().config?.spinsPerPeriod || 2;
                    const used = data.usedSpins || 0;
                    const rem = typeof data.remainingSpins === 'number' ? data.remainingSpins : Math.max(0, max - used);
                    const canSpinVal = Boolean(data.canSpin && rem > 0);

                    set({
                        canSpin: canSpinVal,
                        remainingSpins: rem,
                        maxSpins: max,
                        usedSpins: used,
                        isLoggedIn: Boolean(data.isLoggedIn ?? !!userId),
                        requireLogin: Boolean(data.requireLogin ?? true),
                        nextSpinAt: data.nextSpinAt || null,
                        statusReason: data.reason || (!canSpinVal ? 'period_limit' : null),
                        statusMessage: data.message || null,
                        recentRewards: data.myRecentRewards || [],
                        isLoadingCheck: false,
                    });
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra lượt quay:', error);
                set({ isLoadingCheck: false });
            }
        },

        getTimeUntilNextSpin: () => {
            const { nextSpinAt } = get();
            if (!nextSpinAt) {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const diff = tomorrow.getTime() - now.getTime();
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${h}h ${m}m`;
            }
            const diff = new Date(nextSpinAt).getTime() - Date.now();
            if (diff <= 0) return '0h 0m';
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            return `${h}h ${m}m`;
        },
    })
);
