/**
 * syncManager.js — Orchestrateur de synchronisation
 *
 * Utilisé par le processus main d'Electron.
 * Gère : push → pull → mise à jour du timestamp
 *
 * Retry avec backoff exponentiel :
 *  - 1ère tentative : immédiate
 *  - 2ème : +30s, 3ème : +60s, 4ème : +120s, 5ème : +240s
 *  - Au-delà de 5 tentatives : abandon (admin doit relancer manuellement)
 */

const log            = require('./logger');
const { pushToServer } = require('./push');
const { pullFromServer } = require('./pull');

const RETRY_DELAYS = [0, 30_000, 60_000, 120_000, 240_000]; // ms

class SyncManager {
    /**
     * @param {object} opts
     * @param {string}   opts.apiBase  - URL API ex: 'http://localhost:5000/api'
     * @param {object}   opts.store    - electron-store instance
     * @param {function} opts.onEvent  - Callback pour notifier le renderer
     */
    constructor({ apiBase, store, onEvent }) {
        this.apiBase   = apiBase;
        this.store     = store;
        this.onEvent   = onEvent || (() => {});
        this.syncing   = false;
        this.retryTimer = null;
        this.retryCount = 0;
    }

    /** Déclenche une synchronisation complète (push + pull) */
    async sync() {
        if (this.syncing) {
            log.warn('Sync déjà en cours — ignorée');
            return { skipped: true };
        }

        // Vérifier le token avant de démarrer la sync
        const token = this.store.get('authToken');
        if (!token) {
            return { skipped: true, reason: 'not_authenticated' };
        }

        this.syncing = true;
        this._emit('start', { at: new Date().toISOString() });
        log.sync('=== SYNCHRONISATION DÉMARRÉE ===');

        try {

            // ── 1. PUSH : envoyer les modifs locales ──────────────────────────
            this._emit('push:start');
            const pushResult = await pushToServer(this.apiBase, token);
            this._emit('push:done', pushResult);
            this.store.set('pendingCount', pushResult.failed);

            // ── 2. PULL : récupérer les nouvelles données ─────────────────────
            this._emit('pull:start');
            const lastSyncAt = this.store.get('lastSyncAt', null);
            const pullResult = await pullFromServer(this.apiBase, token, lastSyncAt);
            this._emit('pull:done', pullResult);

            // ── 3. Mettre à jour le timestamp de sync ─────────────────────────
            const now = new Date().toISOString();
            this.store.set('lastSyncAt', now);
            this.retryCount = 0;

            const summary = { pushed: pushResult.pushed, pulled: pullResult.total, at: now };
            this._emit('done', summary);
            log.sync('=== SYNCHRONISATION TERMINÉE ===', summary);
            return summary;

        } catch (err) {
            log.error('SYNC ERROR', { error: err.message });
            this._emit('error', { message: err.message });

            // Retry avec backoff exponentiel
            this._scheduleRetry();
            return { error: err.message };

        } finally {
            this.syncing = false;
        }
    }

    /** Planifie un retry avec backoff */
    _scheduleRetry() {
        if (this.retryCount >= RETRY_DELAYS.length - 1) {
            log.warn('Max retries atteint — sync abandonnée');
            this._emit('retry:abandoned');
            return;
        }

        this.retryCount++;
        const delay = RETRY_DELAYS[this.retryCount];
        log.warn(`Retry ${this.retryCount} planifié dans ${delay / 1000}s`);
        this._emit('retry:scheduled', { attempt: this.retryCount, delay });

        clearTimeout(this.retryTimer);
        this.retryTimer = setTimeout(() => this.sync(), delay);
    }

    /** Émet un événement vers le renderer */
    _emit(type, data = {}) {
        this.onEvent({ type, ...data });
    }

    /** Sauvegarde le token JWT pour les appels API et déclenche une sync */
    setAuthToken(token) {
        this.store.set('authToken', token);
        log.info('Token mis à jour — sync déclenchée');
        // Petite pause pour laisser le frontend finir le login
        setTimeout(() => this.sync(), 1500);
    }

    /** Efface le token lors de la déconnexion */
    clearAuthToken() {
        this.store.delete('authToken');
        log.info('Token effacé');
    }

    /** Annule le retry en cours */
    cancelRetry() {
        clearTimeout(this.retryTimer);
        this.retryCount = 0;
    }
}

module.exports = SyncManager;
