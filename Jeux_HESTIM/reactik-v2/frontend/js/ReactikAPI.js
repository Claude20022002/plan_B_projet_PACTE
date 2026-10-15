/**
 * ReactikAPI.js - Senior Software Engineer
 * Frontend Service for API communication.
 */
export class ReactikAPI {
    constructor() {
        this.apiBase = "/api/reactik";
    }

    async getGameState(equipeId) {
        const res = await fetch(`${this.apiBase}/game/state/${equipeId}`);
        return await res.json();
    }

    async postAction(actionData) {
        const res = await fetch(`${this.apiBase}/game/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(actionData)
        });
        
        if (res.status === 409) throw new Error('CONCURRENCY_ERROR');
        return await res.json();
    }
}
