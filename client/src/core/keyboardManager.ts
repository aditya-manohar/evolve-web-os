// core/keyboardManager.ts
type KeyboardHandler = {
    id: string;
    priority: number;
    handler: (e: KeyboardEvent) => boolean;
};

class KeyboardManager {
    private handlers: KeyboardHandler[] = [];
    private isProcessing = false;

    registerHandler(id: string, priority: number, handler: (e: KeyboardEvent) => boolean) {
        this.handlers.push({ id, priority, handler });
        this.sortHandlers();
        return () => this.unregisterHandler(id);
    }

    private sortHandlers() {
        this.handlers.sort((a, b) => b.priority - a.priority);
    }

    unregisterHandler(id: string) {
        this.handlers = this.handlers.filter(h => h.id !== id);
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if (this.isProcessing) return;

        this.isProcessing = true;

        try {
            // Try handlers in priority order
            for (const { handler } of this.handlers) {
                if (handler(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return true;
                }
            }
        } finally {
            this.isProcessing = false;
        }
        return false;
    }

    clear() {
        this.handlers = [];
    }
}

export const keyboardManager = new KeyboardManager();

// Initialize global listener
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', keyboardManager.handleKeyDown, true);
}