import { GenerationEngine } from "../services/generation/GenerationEngine.js";

/**
 * Facade compatible avec l'ancien controleur.
 * Le moteur reel vit dans backend/services/generation.
 */
export const genererAffectationsAutomatiques = async (params) => {
    const engine = new GenerationEngine();
    return engine.generate(params);
};
