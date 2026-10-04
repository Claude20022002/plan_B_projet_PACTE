/**
 * Services d'enseignement (phase P3) : aides d'affichage partagées par la liste des
 * enseignements et le dialogue d'équipe pédagogique.
 */

// Pastilles : seules les exceptions (à accepter, refusé) sont signalées ; un service accepté n'en a pas
export const TON_SERVICE = { propose: 'warning', refuse: 'neutral' };

/** « N. SQUALLI » */
export const nomCourt = (enseignant) => (enseignant ? `${enseignant.prenom?.[0] ? `${enseignant.prenom[0]}. ` : ''}${enseignant.nom}` : '');

/** Un enseignement a un principal tant que celui-ci n'a pas refusé. */
export const principalActif = (services = []) => services.find((s) => s.role === 'principal' && s.statut_service !== 'refuse');
