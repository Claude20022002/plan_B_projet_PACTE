import { TerminalEngine, challengeList, checkResult, definirJoueur, normalizeUser } from './moteur.js';
import { DEFIS_FR, INDICES_PAR_DEFAUT_FR } from './defis-fr.js';

/**
 * Partie de terminal, indépendante de l'affichage (web et mobile) : on tape une ligne, le moteur
 * répond, puis on demande la vérification de l'objectif du défi. Les textes viennent dans la
 * langue de l'interface (français, sinon l'anglais d'origine).
 */

/** Indices : 0 aucun, 1 à 3 indices de plus en plus précis, 4 réponse affichée. */
export const INDICES_MAX = 3;
export const NIVEAU_REPONSE = 4;

/** Points d'un défi selon l'aide utilisée (même barème que Terminal Quest). */
export const pointsPour = (xp, indices) => {
  const n = Math.max(0, Math.min(NIVEAU_REPONSE, Number(indices) || 0));
  if (n >= NIVEAU_REPONSE) return 10;
  return Math.round(xp * [1, 0.8, 0.6, 0.4][n]);
};

const francais = (langue) => String(langue || 'fr').toLowerCase().startsWith('fr');

/** Défi dans la langue demandée, sans le code de mise en place ni de vérification. */
export const texteDefi = (defi, langue = 'fr') => {
  const fr = francais(langue) ? DEFIS_FR[defi.id] : null;
  return {
    id: defi.id,
    niveau: defi.level,
    niveauNom: fr?.niveau ?? defi.levelName,
    titre: fr?.titre ?? defi.title,
    explication: fr?.explication ?? defi.explanation,
    objectif: fr?.objectif ?? defi.objective,
    exemple: defi.example,
    solution: defi.solution,
    indices: fr ? fr.indices ?? INDICES_PAR_DEFAUT_FR : defi.hints,
    xp: defi.xp,
    boss: Boolean(defi.boss),
  };
};

/** Liste des défis Linux dans l'ordre du parcours. */
export const defisLinux = (langue = 'fr') => challengeList.map((d) => texteDefi(d, langue));

/** Niveaux du parcours : [{ niveau, nom, defis: [id…] }] */
export const niveauxLinux = (langue = 'fr') => {
  const niveaux = new Map();
  for (const d of defisLinux(langue)) {
    if (!niveaux.has(d.niveau)) niveaux.set(d.niveau, { niveau: d.niveau, nom: d.niveauNom, defis: [] });
    niveaux.get(d.niveau).defis.push(d.id);
  }
  return [...niveaux.values()];
};

export class PartieTerminal {
  /**
   * @param {string} idDefi identifiant du défi (ou null : bac à sable libre)
   * @param {object} options joueur (nom affiché dans l'invite), langue
   */
  constructor(idDefi, { joueur = 'etudiant', langue = 'fr' } = {}) {
    definirJoueur(normalizeUser(joueur) || 'etudiant');
    this.langue = langue;
    this.defi = idDefi ? challengeList.find((d) => d.id === idDefi) ?? null : null;
    if (idDefi && !this.defi) throw new Error(`Défi inconnu : ${idDefi}`);
    this.moteur = new TerminalEngine(this.defi ? this.defi.setup() : undefined);
  }

  get invite() {
    return this.moteur.prompt;
  }

  /** Exécute une ligne : { sortie, erreur, effacer } */
  executer(ligne) {
    const r = this.moteur.executeLine(ligne);
    return { sortie: r.stdout || '', erreur: r.stderr || '', effacer: Boolean(r.clear) };
  }

  /** Complétion (Tab) : { valeur, suggestions } */
  completer(ligne) {
    const r = this.moteur.autocomplete(ligne);
    return { valeur: r.value, suggestions: r.suggestions };
  }

  /** Historique pour les flèches haut / bas */
  get historique() {
    return this.moteur.history;
  }

  /** L'objectif est-il atteint ? { ok, message } dans la langue de la partie */
  verifier() {
    if (!this.defi) return { ok: false, message: '' };
    const m = this.moteur;
    const etat = { fs: m.fs, cwd: m.cwd, output: m.lastExecution.stdout, stderr: m.lastExecution.stderr, engine: m, history: m.history, home: m.localFs.home };
    let validation;
    try {
      validation = this.defi.validator(etat);
    } catch {
      validation = checkResult(false, null);
    }
    const ok = typeof validation === 'boolean' ? validation : Boolean(validation?.ok);
    if (ok) return { ok: true, message: '' };
    const fr = francais(this.langue) ? DEFIS_FR[this.defi.id] : null;
    return { ok: false, message: fr?.echec ?? validation?.message ?? 'The objective is not met yet.' };
  }
}

/** Limites d'une partie rejouée par le serveur (lignes tapées, longueur d'une ligne). */
export const COMMANDES_MAX = 300;
export const LONGUEUR_COMMANDE_MAX = 1000;

/**
 * Rejoue les commandes d'une partie depuis l'état initial du défi et vérifie l'objectif : le
 * serveur n'enregistre une réussite que si ces commandes l'atteignent réellement. Le moteur est
 * déterministe (seule la commande date dépend du jour).
 * @returns {boolean}
 */
export const rejouerDefi = (idDefi, commandes, { joueur = 'etudiant' } = {}) => {
  const partie = new PartieTerminal(idDefi, { joueur });
  for (const ligne of commandes) partie.executer(ligne);
  return partie.verifier().ok;
};
