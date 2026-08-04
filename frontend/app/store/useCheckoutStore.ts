import { create } from 'zustand';

interface CheckoutState {
    shippingFee: number;
    setShippingFee: (fee: number) => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
    shippingFee: 0,
    setShippingFee: (fee) => set({ shippingFee: fee }),
}));
