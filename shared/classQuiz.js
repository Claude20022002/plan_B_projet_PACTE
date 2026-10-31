/**
 * ClassQuiz, fonctionnalité de l'établissement (plan multi-établissements, lot ME-0c ;
 * conception-me0c-ecrans-groupe-b.md, règles C-1, C-2 et C-6). Une seule règle pour le site et
 * l'application : GET /api/quiz/config est lu une fois par session, et toute réponse douteuse
 * (erreur, délai dépassé, adresse absente) vaut « éteint ». Sans React ni client HTTP : chaque
 * côté donne sa fonction de lecture (quizAPI.getConfig, chargerConfigQuiz).
 */

/** Au-delà, la configuration est tenue pour illisible : ClassQuiz est traité comme éteint (C-2). */
export const DELAI_CONFIG_MS = 8000;

export const ETEINT = Object.freeze({ actif: false, url: null, peutLancer: false });

/** État de ClassQuiz d'après la réponse de /quiz/config : allumé seulement avec une adresse http(s). */
export const etatClassQuiz = (config) => {
  const url = typeof config?.url === 'string' ? config.url : '';
  if (config?.actif !== true || !/^https?:\/\/[^/\s]+/.test(url)) return ETEINT;
  return { actif: true, url, peutLancer: config.peutLancer === true };
};

/**
 * Source de l'état de ClassQuiz pour une session. `lire()` rend toujours une promesse résolue : la
 * réponse lue (gardée en mémoire), ou ETEINT après une erreur ou un délai dépassé (non gardé : la
 * lecture suivante réessaie). Plusieurs lectures en même temps partagent la même requête.
 * @param {() => Promise<object>} charger lit /quiz/config
 */
export const creerSourceClassQuiz = (charger, { delaiMs = DELAI_CONFIG_MS } = {}) => {
  let enMemoire = null;

  const lire = () => {
    if (enMemoire) return enMemoire;
    let minuteur;
    const delai = new Promise((_, rejeter) => {
      minuteur = setTimeout(() => rejeter(new Error('Configuration des quiz sans réponse')), delaiMs);
    });
    const promesse = Promise.race([Promise.resolve().then(charger), delai])
      .finally(() => clearTimeout(minuteur))
      .then(etatClassQuiz, () => {
        if (enMemoire === promesse) enMemoire = null;
        return ETEINT;
      });
    enMemoire = promesse;
    return promesse;
  };

  return { lire, oublier: () => { enMemoire = null; } };
};

/**
 * QR d'une partie du moteur de quiz (adresse « …/play?pin=<code> »), reconnu sans connaître son
 * adresse : quand ClassQuiz est éteint, le scanner le dit au lieu de le prendre pour un code d'appel (C-6).
 */
export const ressembleAPartie = (texte) => /^https?:\/\/[^/?#\s]+\/play\?(?:[^#\s]*&)?pin=\d{4,12}(?:[&#]|$)/.test(String(texte ?? '').trim());
