import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WheelPrize {
    id: number;
    label: string;
    shortLabel: string;
    type: 'voucher' | 'freeship' | 'retry';
    value?: number;       // % hoặc số tiền
    code?: string;        // mã voucher
    color: string;
    textColor: string;
    emoji: string;
}

export const WHEEL_PRIZES: WheelPrize[] = [
    { id: 0, label: 'Voucher giảm 5%',  shortLabel: '-5%',      type: 'voucher',  value: 5,  code: 'SPIN5',    color: '#F59E0B', textColor: '#fff', emoji: '🎁' },
    { id: 1, label: 'Freeship',          shortLabel: 'SHIP',     type: 'freeship', value: 0,  code: 'FREESHIP', color: '#3B82F6', textColor: '#fff', emoji: '🚚' },
    { id: 2, label: 'Chúc may mắn lần sau', shortLabel: '😔',   type: 'retry',    value: 0,  code: '',         color: '#6B7280', textColor: '#fff', emoji: '😔' },
    { id: 3, label: 'Voucher giảm 20%', shortLabel: '-20%',      type: 'voucher',  value: 20, code: 'SPIN20',   color: '#8B5CF6', textColor: '#fff', emoji: '💸' },
    { id: 4, label: 'Voucher giảm 10%', shortLabel: '-10%',      type: 'voucher',  value: 10, code: 'SPIN10',   color: '#10B981', textColor: '#fff', emoji: '🎉' },
    { id: 5, label: 'Chúc may mắn lần sau', shortLabel: '😔',   type: 'retry',    value: 0,  code: '',         color: '#9CA3AF', textColor: '#fff', emoji: '😔' },
    { id: 6, label: 'Giảm 50.000đ',     shortLabel: '-50K',     type: 'voucher',  value: 50000, code: 'SPIN50K', color: '#EF4444', textColor: '#fff', emoji: '💰' },
    { id: 7, label: 'Voucher giảm 15%', shortLabel: '-15%',      type: 'voucher',  value: 15, code: 'SPIN15',   color: '#EC4899', textColor: '#fff', emoji: '✨' },
];

interface LuckyWheelStore {
    isOpen: boolean;
    lastSpinDate: string | null;
    wonPrize: WheelPrize | null;
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
            lastSpinDate: null,
            wonPrize: null,

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
