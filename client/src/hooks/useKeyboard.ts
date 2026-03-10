// hooks/useKeyboard.ts
import { useEffect, useRef } from 'react';
import { keyboardManager } from '../core/keyboardManager';
import { useWindowManager } from '../store/windowManager';

type KeyConfig = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    handler: (e: KeyboardEvent) => void;
};

type KeyboardOptions = {
    id: string;
    priority?: number;
    keys: KeyConfig[];
    windowId?: string; // If provided, only works when this window is active
};

export function useKeyboard({ id, priority = 0, keys, windowId }: KeyboardOptions) {
    const keysRef = useRef(keys);
    const activeWindow = useWindowManager(state => state.activeWindow);

    useEffect(() => {
        keysRef.current = keys;
    }, [keys]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // If this handler is for a specific window, check if it's active
            if (windowId !== undefined && activeWindow !== windowId) {
                return false;
            }

            // Find matching key combination
            for (const keyConfig of keysRef.current) {
                const keyMatch = e.key.toLowerCase() === keyConfig.key.toLowerCase();
                const ctrlMatch = keyConfig.ctrl === undefined ? !e.ctrlKey : keyConfig.ctrl === e.ctrlKey;
                const shiftMatch = keyConfig.shift === undefined ? !e.shiftKey : keyConfig.shift === e.shiftKey;
                const altMatch = keyConfig.alt === undefined ? !e.altKey : keyConfig.alt === e.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    keyConfig.handler(e);
                    return true;
                }
            }

            return false;
        };

        const unregister = keyboardManager.registerHandler(id, priority, handler);
        return unregister;
    }, [id, priority, windowId, activeWindow]);
}