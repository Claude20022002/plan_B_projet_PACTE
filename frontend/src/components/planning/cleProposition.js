/** Clé stable d'une proposition de l'assistant de créneaux (date, créneau et salle). */
export const cleProposition = (p) => `${p.date}-${p.id_creneau}-${p.id_salle}`;
