// store/windowManager.ts
import { create } from "zustand"

type WindowState = {
  activeWindow: string | null
  windows: Set<string>
  zCounter: number
  setActiveWindow: (id: string | null) => void
  registerWindow: (id: string) => void
  unregisterWindow: (id: string) => void
  getNextZIndex: () => number
}

export const useWindowManager = create<WindowState>((set, get) => ({
  activeWindow: null,
  windows: new Set(),
  zCounter: 10,

  setActiveWindow: (id) => {
    set({ activeWindow: id })
  },

  registerWindow: (id) => {
    set((state) => {
      if (state.windows.has(id)) return state
      const newWindows = new Set(state.windows)
      newWindows.add(id)
      return { windows: newWindows }
    })
  },

  unregisterWindow: (id) => {
    set((state) => {
      const newWindows = new Set(state.windows)
      newWindows.delete(id)

      const activeWindow = state.activeWindow === id ? null : state.activeWindow

      return {
        windows: newWindows,
        activeWindow
      }
    })
  },

  getNextZIndex: () => {
    const current = get().zCounter
    set({ zCounter: current + 1 })
    return current + 1
  }
}))