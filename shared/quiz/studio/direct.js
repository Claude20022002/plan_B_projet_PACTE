import { normaliser } from './correction.js';

/**
 * Quiz en direct du Studio (docs/plans/sortie-classquiz.md, lot SC-1) : règles communes au serveur,
 * au site et à l'application. Fonctions pures, sans réseau ni DOM.
 *
 * Déroulé d'une diffusion en direct, au signal de l'enseignant :
 *   attente → question → correction → (classement) → question suivante … → termine
 *
 * Points : justesse et rapidité (décision du 20 octobre 2026), comme Kahoot. Une réponse fausse ne
 * rapporte rien ; une réponse juste rapporte entre la moitié et la totalité des points selon sa
 * rapidité, mesurée par le serveur.
 */

export const ETAPES = ['attente', 'question', 'correction', 'classement', 'termine'];

/** Types qui se répondent en quelques secondes ; les autres restent pour la diffusion « chacun à son rythme ». */
export const TYPES_DIRECT = ['choix_unique', 'choix_multiple', 'vrai_faux', 'numerique', 'reponse_courte', 'ordre'];

/** Temps de réponse à une question, en secondes. */
export const DUREE_QUESTION = { min: 5, max: 120, defaut: 20 };

/** Points d'une question à un point, répondue juste à l'instant même. */
export const POINTS_BASE = 1000;

/** Marge réseau : une réponse envoyée avant la fin du chrono peut arriver un peu après. */
export const MARGE_MS = 1500;

/** Durée d'une question lue d'un réglage : un entier borné, la valeur par défaut sinon. */
export const dureeQuestion = (brut) => {
  const n = Math.round(Number(brut));
  if (brut === undefined || brut === null || brut === '' || !Number.isFinite(n)) return DUREE_QUESTION.defaut;
  return Math.min(DUREE_QUESTION.max, Math.max(DUREE_QUESTION.min, n));
};

/**
 * Points du jeu pour une réponse.
 * @param {{ part: number, delaiMs: number, dureeS: number, poids?: number }} r part des points de la
 *   question obtenue (0 à 1), délai depuis l'ouverture, durée de la question, points de la question
 * @returns {number} entier : POINTS_BASE × poids × part, réduit de moitié au plus selon le délai
 */
export const pointsDirect = ({ part, delaiMs, dureeS, poids = 1 }) => {
  if (!(part > 0)) return 0;
  const ratio = Math.min(Math.max(delaiMs / (dureeS * 1000), 0), 1);
  return Math.round(POINTS_BASE * poids * Math.min(part, 1) * (1 - ratio / 2));
};

/** Questions qu'on ne peut pas poser en direct (réponse rédigée, zone sur image, association, texte à trous). */
export const questionsHorsDirect = (questions) => questions.filter((q) => !TYPES_DIRECT.includes(q.type));

/**
 * Classement des joueurs : points décroissants ; deux joueurs à égalité ont le même rang.
 * @param {{ points: number, nom?: string, prenom?: string }[]} joueurs
 * @returns {Array<object & { rang: number }>}
 */
export const classer = (joueurs) => {
  const tries = [...joueurs].sort((a, b) => b.points - a.points || `${a.nom ?? ''} ${a.prenom ?? ''}`.localeCompare(`${b.nom ?? ''} ${b.prenom ?? ''}`));
  return tries.map((j) => ({ ...j, rang: 1 + tries.filter((x) => x.points > j.points).length }));
};

/**
 * Défi par équipes : moyenne des points des joueurs de chaque groupe de TP (une grande équipe n'est
 * pas avantagée), classée comme les joueurs.
 * @param {{ id_user: number, points: number }[]} joueurs
 * @param {Map<number, { id: number, nom: string }>} equipeDe équipe de chaque joueur (par id_user)
 */
export const classerEquipes = (joueurs, equipeDe) => {
  const equipes = new Map();
  for (const j of joueurs) {
    const e = equipeDe.get(j.id_user);
    if (!e) continue;
    if (!equipes.has(e.id)) equipes.set(e.id, { id: e.id, nom: e.nom, total: 0, joueurs: 0 });
    const ligne = equipes.get(e.id);
    ligne.total += j.points;
    ligne.joueurs += 1;
  }
  return classer([...equipes.values()].map((e) => ({ id: e.id, nom: e.nom, joueurs: e.joueurs, points: Math.round(e.total / e.joueurs) })));
};

/** Nuage de mots des réponses courtes : texte normalisé, nombre d'étudiants, les plus fréquents d'abord. */
export const nuageDeMots = (textes, max = 30) => {
  const compte = new Map();
  for (const brut of textes) {
    const cle = normaliser(brut);
    if (!cle) continue;
    const ligne = compte.get(cle) ?? { texte: String(brut).trim(), nombre: 0 };
    ligne.nombre += 1;
    compte.set(cle, ligne);
  }
  return [...compte.values()].sort((a, b) => b.nombre - a.nombre || a.texte.localeCompare(b.texte)).slice(0, max);
};

/**
 * Réponses choisies, affichées à la correction : par option (choix), vrai ou faux, sinon rien.
 * @returns {{ id: string, nombre: number }[] | null}
 */
export const repartition = (question, reponses) => {
  const d = question.donnees;
  if (question.type === 'choix_unique' || question.type === 'choix_multiple') {
    const compte = new Map(d.options.map((o) => [o.id, 0]));
    for (const r of reponses) for (const id of [].concat(r ?? [])) if (compte.has(id)) compte.set(id, compte.get(id) + 1);
    return [...compte].map(([id, nombre]) => ({ id, nombre }));
  }
  if (question.type === 'vrai_faux') {
    return [true, false].map((v) => ({ id: String(v), nombre: reponses.filter((r) => r === v).length }));
  }
  return null;
};
