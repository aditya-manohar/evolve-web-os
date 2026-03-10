import { create } from "zustand"

type WindowState = {
  activeWindow: string | null
  activeContext: "desktop" | "window"
  setActiveWindow: (id: string) => void
  setDesktopActive: () => void
}

export const useWindowManager = create<WindowState>((set) => ({
  activeWindow: null,
  activeContext: "desktop",

  setActiveWindow: (id) =>
    set({
      activeWindow: id,
      activeContext: "window"
    }),

  setDesktopActive: () =>
    set({
      activeWindow: null,
      activeContext: "desktop"
    })
}))