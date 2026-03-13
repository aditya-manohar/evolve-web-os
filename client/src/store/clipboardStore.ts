import { create } from "zustand"

export type ClipboardItem = {
    name: string
    path: string
    type: "file" | "folder"
    sourcePath: string
}

type ClipboardState = {
    items: ClipboardItem[]
    action: "copy" | "cut" | null
    setClipboard: (items: ClipboardItem[], action: "copy" | "cut") => void
    clearClipboard: () => void
    hasItems: () => boolean
}

export const useClipboard = create<ClipboardState>((set, get) => ({
    items: [],
    action: null,

    setClipboard: (items, action) => {
        set({ items, action })
    },

    clearClipboard: () => {
        set({ items: [], action: null })
    },

    hasItems: () => {
        return get().items.length > 0
    }
}))