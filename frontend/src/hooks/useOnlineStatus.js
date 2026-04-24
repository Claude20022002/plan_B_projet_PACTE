/**
 * useOnlineStatus — Détecte si l'application est online ou offline.
 *
 * En mode Electron : écoute les événements du processus main via electronAPI.
 * En mode navigateur : écoute window.online / window.offline.
 */

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        // ── Mode Electron ─────────────────────────────────────────────────────
        if (window.electronAPI?.onNetworkChange) {
            // État initial
            window.electronAPI.getOnlineStatus().then(setIsOnline);

            // Écouter les changements
            const unsubscribe = window.electronAPI.onNetworkChange(setIsOnline);
            return unsubscribe;
        }

        // ── Mode navigateur (fallback) ────────────────────────────────────────
        const handleOnline  = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online',  handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online',  handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

/**
 * useSync — Accès au statut et déclencheur de synchronisation.
 */
export function useSync() {
    const [syncStatus, setSyncStatus] = useState(null);
    const [syncing,    setSyncing]    = useState(false);

    useEffect(() => {
        if (!window.electronAPI?.onSyncEvent) return;

        window.electronAPI.getSyncStatus().then(setSyncStatus);

        const unsubscribe = window.electronAPI.onSyncEvent((event) => {
            setSyncing(event.type === 'start' || event.type === 'push:start' || event.type === 'pull:start');
            if (event.type === 'done') {
                setSyncStatus(prev => ({ ...prev, lastSync: event.at, pending: 0 }));
            }
        });

        return unsubscribe;
    }, []);

    const triggerSync = () => window.electronAPI?.triggerSync?.();

    return { syncStatus, syncing, triggerSync };
}
