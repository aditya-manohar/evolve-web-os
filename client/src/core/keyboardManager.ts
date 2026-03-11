type KeyboardHandler = {
    id: string;
    priority: number;
    handler: (e: KeyboardEvent) => boolean; // Return true if handled, false to continue
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
        if (this.isProcessing) return false;

        this.isProcessing = true;

        try {
            // Try handlers in priority order
            for (const { handler } of this.handlers) {
                if (handler(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.isProcessing = false;
                    return true;
                }
            }
        } finally {
            this.isProcessing = false;
        }

        // If no handler claimed the event, let it propagate naturally
        return false;
    }

    clear() {
        this.handlers = [];
    }
}

export const keyboardManager = new KeyboardManager();

// Initialize global listener - use bubble phase instead of capture
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', keyboardManager.handleKeyDown, false);
}