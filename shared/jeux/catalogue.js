import { challengeList } from '../terminal/moteur.js';

/**
 * Catalogue des jeux de la plateforme, commun au serveur (validation de la progression), au web
 * et au mobile (affichage). ClassQuiz n'y figure pas : ses quiz vivent dans son propre service.
 *
 * Ajouter un jeu : une entrée ici (code stable, il est enregistré en base ; `modes` dit s'il se
 * joue seul sur téléphone ou au tableau avec la classe), son moteur dans shared/<jeu>/ et son
 * écran sur le web et le mobile.
 */
export const JEUX = [
  {
    code: 'terminal-linux',
    type: 'terminal',
    // individuel : chacun joue sur son téléphone ; collectif : la classe propose, l'enseignant joue au tableau
    modes: ['individuel', 'collectif'],
    discipline: 'informatique',
    titre: { fr: 'Terminal Linux', en: 'Linux terminal' },
    resume: {
      fr: "Naviguer, chercher, rediriger, gérer droits et processus, jusqu'à une astreinte sur un serveur : de vraies commandes, dans un terminal simulé.",
      en: 'Navigate, search, redirect, manage permissions and processes, up to an on-call shift on a server: real commands in a simulated terminal.',
    },
    source: { nom: 'Terminal Quest', auteur: 'Bruno Zapico', url: 'https://github.com/brunozapico/terminal_quest', licence: 'MIT' },
    defis: challengeList.map((d) => ({ id: d.id, niveau: d.level, xp: d.xp, boss: Boolean(d.boss) })),
  },
];

export const MODES_JEU = ['individuel', 'collectif'];

/** Façons de lancer un jeu en classe ; un jeu qui n'en déclare pas se joue seul */
export const modesDuJeu = (jeu) => (Array.isArray(jeu?.modes) && jeu.modes.length ? jeu.modes : ['individuel']);

export const jeuParCode =(code) => JEUX.find((j) => j.code === code) ?? null;

export const defiDuJeu = (jeu, idDefi) => jeu?.defis.find((d) => d.id === idDefi) ?? null;

/** Points maximum d'un jeu (tous les défis réussis sans aide) */
export const pointsMax = (jeu) => jeu.defis.reduce((total, d) => total + d.xp, 0);

/** Libellé dans la langue de l'interface */
export const libelle = (texte, langue = 'fr') =>
  texte?.[String(langue || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en'] ?? texte?.fr ?? '';
