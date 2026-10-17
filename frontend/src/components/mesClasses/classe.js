/**
 * Libellés communs aux écrans de « Mes classes » : nom d'une classe, prochaine séance, temps
 * restant avant la fin d'une séance (pour le rappel de l'appel).
 */

/** Clé stable d'une classe : un module enseigné à un groupe */
export const cleClasse = (c) => `${c.id_cours}:${c.id_groupe}`;

/** « Module · Groupe » */
export const nomClasse = (c) => `${c.nom_cours} · ${c.nom_groupe}`;

/** Minutes avant la fin de la séance (négatif une fois finie) */
export const minutesAvantFin = (seance, maintenant) => Math.ceil((new Date(`${seance.date}T${seance.heure_fin}:00`) - maintenant) / 60000);

/** « En cours jusqu'à 15:15 · G-S05 » ou « Prochaine séance : lun. 20 oct. à 09:00 · G-S05 » */
export const libelleSeance = (c, t, locale) => {
  const s = c.prochaine_seance;
  if (!s) return t('classes.sansSeance');
  const jour = new Date(`${s.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  return [c.en_cours ? t('classes.enCours', { fin: s.heure_fin }) : t('classes.prochaine', { date: jour, heure: s.heure_debut }), s.salle].filter(Boolean).join(' · ');
};
