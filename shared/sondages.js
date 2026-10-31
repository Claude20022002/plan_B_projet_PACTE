/**
 * Sondage de l'enseignant à sa classe (plan multi-établissements, lot EC-9 ;
 * conception-ec9-groupe-b.md). Partagé par le serveur, le site et l'application : le même sondage
 * est refusé partout, avec le même motif (règle S-3), et dit ouvert ou fermé de la même façon (S-4).
 */

export const SONDAGE = {
  questionMin: 3,
  questionMax: 300,
  choixMin: 2,
  choixMax: 6,
  libelleMax: 100,
};

/** Sous ce nombre de réponses, la répartition n'est pas montrée : une réponse se devinerait (S-7). */
export const SEUIL_ANONYMAT = 3;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Aller-retour : « 2026-02-30 » est lu comme le 2 mars par Date.parse, mais n'existe pas
const dateExiste = (texte) => DATE.test(texte) && !Number.isNaN(Date.parse(texte)) && new Date(`${texte}T00:00:00Z`).toISOString().slice(0, 10) === texte;

/**
 * Contrôle un sondage avant sa création (règle S-3). `jour` est la date de l'école (AAAA-MM-JJ).
 * Rend { motif } si le sondage est refusé — 'question', 'nombreChoix', 'choix', 'doublon' ou
 * 'date' —, sinon { sondage } nettoyé (espaces retirés, date vide → null).
 */
export const verifierSondage = ({ question, choix, ferme_le: fermeLe } = {}, jour) => {
  const texte = typeof question === 'string' ? question.trim() : '';
  if (texte.length < SONDAGE.questionMin || texte.length > SONDAGE.questionMax) return { motif: 'question' };
  if (!Array.isArray(choix) || choix.length < SONDAGE.choixMin || choix.length > SONDAGE.choixMax) return { motif: 'nombreChoix' };
  const libelles = choix.map((c) => (typeof c === 'string' ? c.trim() : ''));
  if (libelles.some((l) => !l || l.length > SONDAGE.libelleMax)) return { motif: 'choix' };
  if (new Set(libelles.map((l) => l.toLocaleLowerCase('fr'))).size !== libelles.length) return { motif: 'doublon' };
  let fin = null;
  if (fermeLe !== undefined && fermeLe !== null && fermeLe !== '') {
    fin = String(fermeLe);
    if (!dateExiste(fin) || fin < jour) return { motif: 'date' };
  }
  return { sondage: { question: texte, choix: libelles, ferme_le: fin } };
};

/** Ouvert : pas clos, et la date de fin (incluse) n'est pas passée (règle S-4). */
export const sondageOuvert = (sondage, jour) => !sondage.clos_le && (!sondage.ferme_le || String(sondage.ferme_le).slice(0, 10) >= jour);

/**
 * Part de chaque choix, en pour cent arrondis, dans l'ordre des choix ; null si la répartition
 * n'est pas connue (sous le seuil, le serveur ne l'envoie pas) ou s'il n'y a aucune réponse.
 */
export const repartition = (choix) => {
  if (!choix.length || choix.some((c) => typeof c.reponses !== 'number')) return null;
  const total = choix.reduce((somme, c) => somme + c.reponses, 0);
  return total ? choix.map((c) => Math.round((100 * c.reponses) / total)) : null;
};
