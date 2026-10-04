/**
 * Droits de préparation des emplois du temps (phase P3) : l'administration sur toutes les
 * filières, un enseignant responsable de filière sur les siennes (user.responsabilites,
 * renvoyé par /auth/me). Le serveur applique les mêmes règles ; ceci ne fait que l'affichage.
 */
export const estResponsable = (user) => user?.role === 'enseignant' && (user.responsabilites?.length ?? 0) > 0;

export const peutPreparer = (user) => user?.role === 'admin' || estResponsable(user);

export const filieresGerables = (filieres, user) =>
    user?.role === 'admin' ? filieres : filieres.filter((f) => user?.responsabilites?.includes(f.id_filiere));
