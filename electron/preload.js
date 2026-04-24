/**
 * preload.js — Bridge sécurisé entre le processus main (Node) et le renderer (React).
 * Exposé sur window.electronAPI via contextBridge.
 * AUCUN accès Node direct dans le renderer — tout passe par ici.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    // ── Réseau ────────────────────────────────────────────────────────────────
    /** Demande l'état réseau actuel */
    getOnlineStatus: () => ipcRenderer.invoke('net:status'),

    /** Écoute les changements online/offline */
    onNetworkChange: (cb) => {
        ipcRenderer.on('net:change', (_event, isOnline) => cb(isOnline));
        return () => ipcRenderer.removeAllListeners('net:change');
    },

    // ── Synchronisation ───────────────────────────────────────────────────────
    /** Déclenche une synchronisation manuelle */
    triggerSync: () => ipcRenderer.invoke('sync:trigger'),

    /** Récupère le statut de la dernière sync */
    getSyncStatus: () => ipcRenderer.invoke('sync:status'),

    /** Écoute les événements de sync (progress, done, error) */
    onSyncEvent: (cb) => {
        ipcRenderer.on('sync:event', (_event, data) => cb(data));
        return () => ipcRenderer.removeAllListeners('sync:event');
    },

    // ── Base de données locale ────────────────────────────────────────────────
    /** Lit les affectations depuis SQLite */
    getLocalAffectations: (filters) => ipcRenderer.invoke('db:affectations:get', filters),

    /** Enregistre une affectation localement (offline) */
    saveLocalAffectation: (data) => ipcRenderer.invoke('db:affectations:save', data),

    /** Supprime une affectation localement */
    deleteLocalAffectation: (id) => ipcRenderer.invoke('db:affectations:delete', id),

    // ── Auth (sync token) ─────────────────────────────────────────────────────
    /** Transmet le token JWT au SyncManager */
    setAuthToken:   (token) => ipcRenderer.invoke('sync:setToken', token),
    clearAuthToken: ()      => ipcRenderer.invoke('sync:clearToken'),

    // ── Application ───────────────────────────────────────────────────────────
    /** Infos de version */
    getVersion: () => ipcRenderer.invoke('app:version'),

    /** Ouvre les logs de sync */
    openSyncLogs: () => ipcRenderer.invoke('app:openLogs'),
});
