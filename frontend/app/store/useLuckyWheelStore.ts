import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WheelPrize {
    id: number | string;
    label: string;
    shortLabel: string;
    type: 'voucher' | 'freeship' | 'retry';
    value?: number;       // % hoặc số tiền
    code?: string;        // mã voucher
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
    lastSpinDate: string | null;
    wonPrize: WheelPrize | null;
    setConfig: (config: WheelConfig) => void;
    openWheel: () => void;
    closeWheel: () => void;
    recordSpin: (prize: WheelPrize) => void;
    clearPrize: () => void;
    canSpinToday: () => boolean;
    getTimeUntilNextSpin: () => string;
}

export const useLuckyWheelStore = create<LuckyWheelStore>()(
    persist(
        (set, get) => ({
            isOpen: false,
            config: null,
            lastSpinDate: null,
            wonPrize: null,

            setConfig: (config) => set({ config }),

            openWheel: () => set({ isOpen: true }),
            closeWheel: () => set({ isOpen: false }),

            recordSpin: (prize) => {
                const today = new Date().toDateString();
                set({ lastSpinDate: today, wonPrize: prize });
            },

            clearPrize: () => set({ wonPrize: null }),

            canSpinToday: () => {
                const { lastSpinDate } = get();
                if (!lastSpinDate) return true;
                return lastSpinDate !== new Date().toDateString();
            },

            getTimeUntilNextSpin: () => {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const diff = tomorrow.getTime() - now.getTime();
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                return `${h}h ${m}m`;
            },
        }),
        {
            name: 'lucky-wheel-store',
            skipHydration: true,
        }
    )
);

if (typeof window !== 'undefined') {
    useLuckyWheelStore.persist.rehydrate();
}
