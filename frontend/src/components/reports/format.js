/**
 * Mise en forme des dates et heures des reports : jour et mois au format de la langue de l'écran,
 * jamais le format américain (l'anglais du site suit l'usage britannique, jour avant mois).
 */

const locale = (langue) => (String(langue).startsWith('en') ? 'en-GB' : 'fr-FR');

/** « lun. 26/10/2026 » : une date (AAAA-MM-JJ ou Date) avec son jour de la semaine. */
export const dateCourte = (date, langue) =>
    date ? new Date(`${String(date).slice(0, 10)}T12:00:00`).toLocaleDateString(locale(langue), { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

/** « lundi 26 octobre » : une date en toutes lettres, sans l'année. */
export const dateLongue = (date, langue) =>
    date ? new Date(`${String(date).slice(0, 10)}T12:00:00`).toLocaleDateString(locale(langue), { weekday: 'long', day: 'numeric', month: 'long' }) : '';

/** « 13:30 » : une heure de la base (13:30:00) sans les secondes. */
export const heureCourte = (heure) => (heure ? String(heure).slice(0, 5) : '');

/**
 * Date et heure de la séance avant le report demandé : { date, heure }. Une demande en attente, à
 * confirmer ou à reprogrammer lit la séance telle qu'elle est (elle n'a pas encore bougé) ; une demande traitée lit la date d'origine gardée par le
 * serveur, car la séance a pu être déplacée depuis (recette du 20 octobre, M-6).
 * `creneaux` : Map id_creneau → créneau, pour l'heure d'origine.
 */
export const origineDe = (demande, creneaux) => {
    const seance = demande.affectation;
    if (!seance) return { date: null, heure: '' };
    if (['en_attente', 'a_confirmer', 'a_reprogrammer'].includes(demande.statut_demande) || !seance.date_seance_initiale) {
        return { date: seance.date_seance, heure: heureCourte(seance.creneau?.heure_debut) };
    }
    return { date: seance.date_seance_initiale, heure: heureCourte(creneaux.get(seance.id_creneau_initial)?.heure_debut) };
};

/**
 * Date et heure demandées : { date, heure } (l'heure vient du créneau visé, s'il est connu).
 * Une demande acceptée sans date (R-1) n'en a pas encore : celle que l'enseignant avait demandée
 * ne vaut plus, l'administration fixera la nouvelle.
 */
export const demandeeDe = (demande, creneaux) =>
    demande.statut_demande === 'a_reprogrammer' ? { date: null, heure: '' } : { date: demande.nouvelle_date, heure: heureCourte(creneaux.get(demande.id_creneau_nouveau)?.heure_debut) };

/** « lun. 26/10/2026 · 13:30 » : une date et son heure, l'heure seulement si elle est connue ; `vide` sans date. */
export const dateEtHeure = ({ date, heure }, langue, vide = '—') => (date ? [dateCourte(date, langue), heure].filter(Boolean).join(' · ') : vide);

/** « Python · CPI-1A · lun. 26/10/2026 · 13:30 » : une séance reconnaissable parmi celles du même jour. */
export const libelleSeance = (seance, langue) =>
    [seance.cours?.nom_cours, seance.groupe?.nom_groupe, dateCourte(seance.date_seance, langue), heureCourte(seance.creneau?.heure_debut)].filter(Boolean).join(' · ');
