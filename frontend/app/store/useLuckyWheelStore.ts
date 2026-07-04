import { create } from 'zustand';

export interface WheelPrize {
    id: number | string;
    label: string;
    shortLabel: string;
    type: 'voucher' | 'freeship' | 'retry';
    value?: number;
    code?: string;
    color: string;
    textColor: string;
    emoji: string;
    probability?: number;
}

export interface WheelConfig {
    isActive: boolean;
    spinsPerDay: number;
    prizes: WheelPrize[];
}

interface LuckyWheelStore {
    isOpen: boolean;
    config: WheelConfig | null;
    canSpin: boolean;
    nextSpinAt: string | null;
    wonPrize: WheelPrize | null;
    setConfig: (config: WheelConfig) => void;
    openWheel: () => void;
    closeWheel: () => void;
    recordSpin: (prize: WheelPrize) => void;
    clearPrize: () => void;
    checkCanSpin: (userId: string) => Promise<void>;
    getTimeUntilNextSpin: () => string;
}

export const useLuckyWheelStore = create<LuckyWheelStore>()(
    (set, get) => ({
        isOpen: false,
        config: null,
        canSpin: true,
        nextSpinAt: null,
        wonPrize: null,

        setConfig: (config) => set({ config }),

        openWheel: () => set({ isOpen: true }),
        closeWheel: () => set({ isOpen: false }),

        recordSpin: (prize) => {
            set({ wonPrize: prize, canSpin: false });
        },

        clearPrize: () => set({ wonPrize: null }),

        // Kiểm tra từ DB thay vì localStorage
        checkCanSpin: async (userId) => {
            try {
                const res = await fetch(`/api/lucky-wheel/can-spin?user_id=${userId}`);
                const data = await res.json();
                if (data.success !== undefined) {
                    set({
                        canSpin: data.canSpin,
                        nextSpinAt: data.nextSpinAt || null
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
