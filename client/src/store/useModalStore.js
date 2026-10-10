import { create } from "zustand";

export const useModalStore = create((set) => ({
    isOpen: false,
    link: "",
    openModal: (link) => set({ isOpen: true, link }),
    closeModal: () => set({ isOpen: false, link: "" }),
}));
