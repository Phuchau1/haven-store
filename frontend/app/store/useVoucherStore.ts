import { create } from 'zustand';

interface AppliedVoucher {
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    discountAmount: number;
    finalAmount: number;
}

interface VoucherStore {
    appliedVoucher: AppliedVoucher | null;
    setVoucher: (v: AppliedVoucher) => void;
    removeVoucher: () => void;
}

export const useVoucherStore = create<VoucherStore>((set) => ({
    appliedVoucher: null,
    setVoucher: (v) => set({ appliedVoucher: v }),
    removeVoucher: () => set({ appliedVoucher: null }),
}));
