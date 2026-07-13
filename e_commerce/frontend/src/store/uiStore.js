import { create } from "zustand";

export const useUIStore = create((set) => ({
  isDrawerOpen: false,
  activeTab: "ai", // "ai" or "chat"
  openDrawer: (tab = "ai") => set({ isDrawerOpen: true, activeTab: tab }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  setTab: (tab) => set({ activeTab: tab }),
}));
