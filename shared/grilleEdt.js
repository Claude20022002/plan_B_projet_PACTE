/**
 * Grille horaire du PDF de l'emploi du temps (plan multi-établissements, lot ME-1 ;
 * conception-me1-grille-pdf-groupe-b.md, règles G-1 à G-7 et G-9) : tirée des créneaux de l'école,
 * et non plus de la grille de l'école pilote écrite en dur. Fonction pure, testée sans navigateur.
 */

export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Une colonne qui commence avant midi est du matin (G-7)
const MIDI = '12:00';

const hhmm = (heure) => String(heure ?? '').slice(0, 5);

/** « 09h00 - 10h45 » */
export const libelleHoraire = (debut, fin) => `${hhmm(debut).replace(':', 'h')} - ${hhmm(fin).replace(':', 'h')}`;

// Jour d'une date AAAA-MM-JJ, lu à midi UTC : le fuseau du navigateur ne le décale pas
const jourDeLaDate = (date) => JOURS[(new Date(`${String(date).slice(0, 10)}T12:00:00Z`).getUTCDay() + 6) % 7];

/** Jour d'une séance : celui de sa date, sinon celui de son créneau (semaine type). */
export const jourDeSeance = (seance) =>
  seance.date_seance ? jourDeLaDate(seance.date_seance) : String(seance.creneau?.jour_semaine ?? '').toLowerCase();

/** Rang manquant (ancien créneau) : sa position dans sa journée, par heure de début (G-2). */
const avecRangs = (creneaux) =>
  creneaux.map((c) => {
    if (Number.isInteger(c.rang) && c.rang > 0) return c;
    const debuts = [...new Set(creneaux.filter((x) => x.jour_semaine === c.jour_semaine).map((x) => hhmm(x.heure_debut)))].sort();
    return { ...c, rang: debuts.indexOf(hhmm(c.heure_debut)) + 1 };
  });

/** Valeur la plus fréquente ; à égalité, la plus petite (la plus tôt). */
const plusFrequente = (valeurs) => {
  const comptes = new Map();
  valeurs.forEach((v) => comptes.set(v, (comptes.get(v) ?? 0) + 1));
  return [...comptes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
};

/**
 * Grille du PDF pour ces séances. `creneaux` : ceux de l'école (GET /api/creneaux), éventuellement
 * vides si la lecture a échoué (G-9 : la grille est alors tirée des créneaux des séances).
 * Rend { jours, colonnes: [{ rang, debut, fin, libelle, matin }], colonneDe(seance), horaireDiffere(seance) }.
 */
export const grilleDuPdf = (creneaux = [], seances = []) => {
  // G-1 : variante normale, régimes des séances exportées (formation initiale par défaut)
  const regimes = new Set(seances.map((s) => s.creneau?.regime).filter(Boolean));
  if (!regimes.size) regimes.add('initiale');
  const normaux = (creneaux ?? []).filter((c) => (c.variante ?? 'normale') === 'normale' && regimes.has(c.regime ?? 'initiale'));
  const source = normaux.length ? normaux : seances.map((s) => s.creneau).filter((c) => c?.heure_debut);
  const grille = avecRangs(source.map((c) => ({ ...c, jour_semaine: String(c.jour_semaine ?? '').toLowerCase() })));

  // G-2 : une colonne par rang, libellée par l'horaire le plus fréquent de ce rang
  const horairesParRang = new Map();
  grille.forEach((c) => horairesParRang.set(c.rang, [...(horairesParRang.get(c.rang) ?? []), `${hhmm(c.heure_debut)}|${hhmm(c.heure_fin)}`]));
  const colonnes = [...horairesParRang.keys()]
    .sort((a, b) => a - b)
    .map((rang) => {
      const [debut, fin] = plusFrequente(horairesParRang.get(rang)).split('|');
      return { rang, debut, fin, libelle: libelleHoraire(debut, fin), matin: debut < MIDI };
    });

  // G-3 : les jours de la grille, plus ceux où tombe une séance
  const jours = JOURS.filter((j) => grille.some((c) => c.jour_semaine === j) || seances.some((s) => jourDeSeance(s) === j));

  // G-4 : le rang du créneau, sinon la dernière colonne commencée à son heure, sinon la première
  const colonneDe = (seance) => {
    if (!colonnes.length) return -1;
    const rang = seance.creneau?.rang;
    const parRang = Number.isInteger(rang) ? colonnes.findIndex((c) => c.rang === rang) : -1;
    if (parRang >= 0) return parRang;
    const debut = hhmm(seance.creneau?.heure_debut);
    let index = 0;
    if (debut) colonnes.forEach((c, i) => { if (c.debut <= debut) index = i; });
    return index;
  };

  // G-5 : l'horaire de la séance n'est pas celui de sa colonne
  const horaireDiffere = (seance) => {
    const colonne = colonnes[colonneDe(seance)];
    const debut = hhmm(seance.creneau?.heure_debut);
    return Boolean(colonne && debut) && (debut !== colonne.debut || hhmm(seance.creneau?.heure_fin) !== colonne.fin);
  };

  return { jours, colonnes, colonneDe, horaireDiffere };
};
