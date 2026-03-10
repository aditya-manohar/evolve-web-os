type KeyboardHandler = (e: KeyboardEvent) => void

let currentHandler: KeyboardHandler | null = null

export function setKeyboardHandler(handler: KeyboardHandler | null) {
    currentHandler = handler
}

window.addEventListener("keydown", (e) => {
    if (currentHandler) {
        currentHandler(e)
    }
})