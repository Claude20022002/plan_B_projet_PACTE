/** Types proposés : l'administration réserve d'abord pour un événement (retours du 21 octobre). */
export const TYPES_RESERVATION = ['evenement', 'reunion', 'soutenance'];

/** Formulaire vide d'une réservation. */
export const RESERVATION_VIDE = { type: 'evenement', titre: '', description: '', date: '', heure_debut: '09:00', heure_fin: '10:30', id_salle: '', personnes: [], groupes: [] };

/** Période d'une réservation par rapport à `aujourdhui` (AAAA-MM-JJ) : 'avenir' ou 'passee'. */
export const periodeDe = (reservation, aujourdhui) => (String(reservation.date).slice(0, 10) >= aujourdhui ? 'avenir' : 'passee');
