import { useEffect, useCallback } from 'react';

export const useHotkeys = (hotkeys: { [key: string]: () => void }, deps: any[] = []) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const handler = hotkeys[event.key];
        if (handler) {
            event.preventDefault();
            handler();
        }
    }, [hotkeys, ...deps]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};
