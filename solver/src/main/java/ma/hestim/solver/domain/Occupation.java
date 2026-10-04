package ma.hestim.solver.domain;

/**
 * Une personne (enseignant, étudiants d'un groupe le plus fin) ou une salle occupée pendant un
 * intervalle élémentaire de la semaine. Deux leçons qui partagent une occupation sont en conflit :
 * les conflits se comptent par regroupement sur cette clé, sans comparer les leçons deux à deux.
 */
public record Occupation(int atome, Object qui) {
}
