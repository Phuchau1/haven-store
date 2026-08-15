import { create } from 'zustand';

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

interface LuckyWheelStore {
    isOpen: boolean;
    config: WheelConfig | null;
    canSpin: boolean;
    remainingSpins: number;
    maxSpins: number;
    nextSpinAt: string | null;
    statusReason: string | null;
    statusMessage: string | null;
    wonPrize: WheelPrize | null;
    setConfig: (config: WheelConfig) => void;
    openWheel: () => void;
    closeWheel: () => void;
    recordSpin: (prize: WheelPrize) => void;
    clearPrize: () => void;
    checkCanSpin: (userId?: string, token?: string | null) => Promise<void>;
    getTimeUntilNextSpin: () => string;
}

export const useLuckyWheelStore = create<LuckyWheelStore>()(
    (set, get) => ({
        isOpen: false,
        config: null,
        canSpin: true,
        remainingSpins: 1,
        maxSpins: 1,
        nextSpinAt: null,
        statusReason: null,
        statusMessage: null,
        wonPrize: null,

        setConfig: (config) => set({ 
            config,
            maxSpins: config.spinsPerPeriod || 1
        }),

        openWheel: () => set({ isOpen: true }),
        closeWheel: () => set({ isOpen: false }),

        recordSpin: (prize) => {
            set((state) => ({ 
                wonPrize: prize, 
                canSpin: false,
                remainingSpins: Math.max(0, state.remainingSpins - 1)
            }));
        },

        clearPrize: () => set({ wonPrize: null }),

        checkCanSpin: async (userId?: string, token?: string | null) => {
            try {
                const deviceId = typeof window !== 'undefined' ? (localStorage.getItem('device_id') || 'web-client') : 'web-client';
                const headers: Record<string, string> = {
                    'x-device-id': deviceId
                };
                if (token) {
                    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                }

                const params = new URLSearchParams();
                if (userId) params.append('user_id', userId);
                params.append('device_id', deviceId);

                const res = await fetch(`/api/lucky-wheel/can-spin?${params.toString()}`, { headers });
                const data = await res.json();
                if (data.success !== undefined) {
                    const max = get().config?.spinsPerPeriod || data.maxSpins || 1;
                    const rem = data.canSpin ? (data.remainingSpins ?? 1) : 0;
                    set({
                        canSpin: !!data.canSpin,
                        remainingSpins: rem,
                        maxSpins: max,
                        nextSpinAt: data.nextSpinAt || null,
                        statusReason: data.reason || null,
                        statusMessage: data.message || null,
                    });
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra lượt quay:', error);
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
