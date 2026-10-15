/**
 * GameEngine.js - Senior Software Engineer
 * Core industrial simulation rules for Reactik V2.
 * Pure business logic, independent of DB or UI.
 */
class GameEngine {
    constructor() {
        this.INITIAL_DELAI = 15;
        this.INITIAL_STOCK = 500;
        
        // PAYS RULES (Cahier des charges)
        this.PAYS_TARGETS = {
            'MAROC': { delaiMax: 6, type: 'Standard', pmGain: 15 },
            'ALLEMAGNE': { delaiMax: 6, type: 'Luxe', pmGain: 20 },
            'JAPON': { delaiMax: 28, type: 'Developpement', pmGain: 25 }
        };
    }

    /**
     * Calculates impact of an improvement.
     */
    calculateImprovement(current, bonusDelai, bonusStock) {
        return {
            delai: Math.max(1, current.delai - bonusDelai),
            stock: Math.max(0, current.stock - bonusStock),
            partMarche: current.partMarche
        };
    }

    /**
     * Final score formula: High efficiency + low stocks = High points.
     */
    calculateFinalScore(state) {
        if (state.delai === 0) return 0;
        return Math.round((state.partMarche * 1000) / (state.delai + (state.stock / 100)));
    }
}

module.exports = new GameEngine();
