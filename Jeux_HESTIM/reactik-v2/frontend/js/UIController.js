/**
 * UIController.js - Senior Software Engineer
 * Manages DOM updates based on game state.
 */
export class UIController {
    constructor() {
        this.container = document.getElementById('reactik-content');
        this.stepper = document.querySelectorAll('.step');
        this.valDelai = document.getElementById('val-delai');
        this.valStock = document.getElementById('val-stock');
        this.valScore = document.getElementById('val-score');
    }

    render(state) {
        // Update progression bar
        this.stepper.forEach(s => {
            const p = parseInt(s.dataset.phase);
            s.className = `step ${p === state.phase ? 'active' : p < state.phase ? 'completed' : ''}`;
        });

        // Switch visible phase
        document.querySelectorAll('.game-phase').forEach(p => p.classList.add('hidden'));
        const active = document.querySelector(`.game-phase[data-phase="${state.phase}"]`);
        if (active) active.classList.remove('hidden');

        // Update indicators
        if (this.valDelai) this.valDelai.textContent = state.delai;
        if (this.valStock) this.valStock.textContent = state.stock;
        if (this.valScore) this.valScore.textContent = state.score;
    }

    notify(msg) {
        alert(msg);
    }
}
