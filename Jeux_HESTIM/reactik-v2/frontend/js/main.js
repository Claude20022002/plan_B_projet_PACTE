/**
 * main.js - Senior Software Engineer
 * Entry point for Reactik V2 student interface.
 */
import { ReactikAPI } from './ReactikAPI.js';
import { UIController } from './UIController.js';

class GameController {
    constructor(api, ui) {
        this.api = api;
        this.ui = ui;
        this.state = { equipeId: null, phase: 1, version: 0 };
    }

    async init() {
        const teamId = document.getElementById('team-id').value;
        this.state.equipeId = teamId;
        await this.sync();
        setInterval(() => this.sync(), 3000);
    }

    async sync() {
        try {
            const serverState = await this.api.getGameState(this.state.equipeId);
            if (serverState.version > this.state.version) {
                this.state = { ...this.state, ...serverState };
                this.ui.render(this.state);
            }
        } catch (e) {
            console.error("Sync error:", e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const api = new ReactikAPI();
    const ui = new UIController();
    const game = new GameController(api, ui);
    game.init();
});
