/**
 * Jours de la grille hebdomadaire (EnhancedTimetable) : lundi → samedi, plus le dimanche quand
 * une séance de la semaine y tombe, comme la page des créneaux et la grille du PDF (ME-1).
 * Une séance du dimanche masquée disparaissait de l'emploi du temps de l'étudiant et de l'enseignant.
 */

const DIMANCHE = 0;

/** Jours à masquer (numérotation de Date.getDay, dimanche = 0) pour les séances d'une semaine. */
export const joursMasques = (seances = []) =>
  seances.some((s) => s.start instanceof Date && s.start.getDay() === DIMANCHE) ? [] : [DIMANCHE];
