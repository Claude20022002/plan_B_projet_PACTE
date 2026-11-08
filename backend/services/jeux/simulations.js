/** Vérifie les essais de simulation contre les scénarios de référence et les droits du module. */
import { simulationParCode } from '../../../shared/simulations/catalogue.js';
import { evaluerSimulation } from '../../../shared/simulations/moteur.js';
import { ErreurMetier } from '../planning/enseignements.js';
import { jeuAccessible, sauvegarderReussite } from './jeux.js';

/** Renvoie le retour calculé ; seule une réussite crée une maîtrise, de façon idempotente. */
export async function essayerSimulation(user, code, idDefi, reponse) {
    const jeu = simulationParCode(code);
    if (!jeu) throw new ErreurMetier('Simulation inconnue', 404);
    await jeuAccessible(user, jeu);
    const defi = jeu.defis.find((d) => d.id === idDefi);
    if (!defi) throw new ErreurMetier('Défi inconnu', 404);
    const resultat = evaluerSimulation(jeu, defi, reponse);
    if (!resultat) throw new ErreurMetier('Saisie de simulation invalide', 400);
    if (!resultat.ok) return { ...resultat, enregistre: false };
    const progression = await sauvegarderReussite(user, jeu, defi);
    return { ...resultat, ...progression, enregistre: true };
}
