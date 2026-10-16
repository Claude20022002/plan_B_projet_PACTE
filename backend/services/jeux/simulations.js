/** Validates simulation attempts against canonical scenarios and existing module permissions. */
import { simulationParCode } from '../../../shared/simulations/catalogue.js';
import { evaluerSimulation } from '../../../shared/simulations/moteur.js';
import { ErreurMetier } from '../planning/enseignements.js';
import { jeuAccessible, sauvegarderReussite } from './jeux.js';

/** Returns calculated feedback; only successful attempts create an idempotent mastery record. */
export async function essayerSimulation(user, code, idDefi, reponse) {
    const jeu = simulationParCode(code);
    if (!jeu) throw new ErreurMetier('Unknown simulation', 404);
    await jeuAccessible(user, jeu);
    const defi = jeu.defis.find((d) => d.id === idDefi);
    if (!defi) throw new ErreurMetier('Unknown challenge', 404);
    const resultat = evaluerSimulation(jeu, defi, reponse);
    if (!resultat) throw new ErreurMetier('Invalid simulation input', 400);
    if (!resultat.ok) return { ...resultat, enregistre: false };
    const progression = await sauvegarderReussite(user, jeu, defi);
    return { ...resultat, ...progression, enregistre: true };
}
