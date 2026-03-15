import { create } from "zustand"

type WindowState = {
  activeWindow: string | null
  windows: Set<string>
  zCounter: number
  windowZIndices: Record<string, number>
  setActiveWindow: (id: string | null) => void
  registerWindow: (id: string) => void
  unregisterWindow: (id: string) => void
  getNextZIndex: () => number
  bringToFront: (id: string) => number
}

export const useWindowManager = create<WindowState>((set, get) => ({
  activeWindow: null,
  windows: new Set(),
  zCounter: 10,
  windowZIndices: {},

  setActiveWindow: (id) => {
    set({ activeWindow: id })
  },

  registerWindow: (id) => {
    set((state) => {
      if (state.windows.has(id)) return state
      const newWindows = new Set(state.windows)
      newWindows.add(id)
      const newZIndex = state.zCounter + 1
      return {
        windows: newWindows,
        zCounter: newZIndex,
        windowZIndices: { ...state.windowZIndices, [id]: newZIndex }
      }
    })
  },

  unregisterWindow: (id) => {
    set((state) => {
      const newWindows = new Set(state.windows)
      newWindows.delete(id)

      const { [id]: _, ...restZIndices } = state.windowZIndices
      const activeWindow = state.activeWindow === id ? null : state.activeWindow

      return {
        windows: newWindows,
        activeWindow,
        windowZIndices: restZIndices
      }
    })
  },

  getNextZIndex: () => {
    const current = get().zCounter
    set({ zCounter: current + 1 })
    return current + 1
  },
  bringToFront: (id) => {
    const newZIndex = get().getNextZIndex()
    set((state) => ({
      activeWindow: id,
      windowZIndices: { ...state.windowZIndices, [id]: newZIndex }
    }))
    return newZIndex
  }
}))