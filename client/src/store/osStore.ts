import { create } from "zustand"

type WindowApp = {
    id: string
    title: string
}

type OSState = {
    windows: WindowApp[]
    openApp: (app: WindowApp) => void
    closeApp: (id: string) => void
}

export const useOSStore = create<OSState>((set) => ({
    windows: [],

    openApp: (app) =>
        set((state) => ({
            windows: [...state.windows, app]
        })),

    closeApp: (id) =>
        set((state) => ({
            windows: state.windows.filter((w) => w.id !== id)
        }))
}))