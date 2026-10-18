import { PartieTerminal } from './jeu.js';

/**
 * Terminal joué au tableau avec la classe (session de jeu en mode collectif) : le serveur garde
 * les commandes choisies par l'enseignant ; le tableau projeté et les téléphones les rejouent
 * depuis l'état initial du défi pour afficher le même écran. Même moteur partout (web, mobile,
 * serveur), donc le même résultat.
 */

/** Nom de joueur du terminal de la classe : le même au tableau, sur les téléphones et au serveur */
export const JOUEUR_CLASSE = 'classe';

/** Lignes gardées à l'écran (les plus récentes) */
const LIGNES_MAX = 400;

/**
 * Rejoue les commandes du tableau et rend ce que le terminal affiche.
 * @param {string} idDefi
 * @param {string[]} commandes
 * @param {{ langue?: string }} options
 * @returns {{ lignes: { type: 'commande'|'sortie'|'erreur', texte: string, invite?: string }[], invite: string }}
 */
export const ecranDuTableau = (idDefi, commandes, { langue = 'fr' } = {}) => {
  const partie = new PartieTerminal(idDefi, { joueur: JOUEUR_CLASSE, langue });
  let lignes = [];
  for (const texte of Array.isArray(commandes) ? commandes : []) {
    const invite = partie.invite;
    const r = partie.executer(texte);
    const sorties = [];
    if (r.erreur) sorties.push({ type: 'erreur', texte: r.erreur.replace(/\n$/, '') });
    if (r.sortie) sorties.push({ type: 'sortie', texte: r.sortie.replace(/\n$/, '') });
    lignes = r.effacer ? sorties : [...lignes, { type: 'commande', invite, texte }, ...sorties];
  }
  return { lignes: lignes.slice(-LIGNES_MAX), invite: partie.invite };
};
