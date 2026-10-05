/**
 * Retour après connexion vers un autre service de la plateforme : un chemin interne de
 * StudyLib (/biblio), ou la reprise d'une connexion OpenID Connect en cours (ClassQuiz,
 * /api/oidc/interaction/<uid>, chemin exact). Une URL absolue, « //hôte », une barre
 * oblique inverse, un caractère de contrôle ou un autre préfixe sont ignorés (pas de
 * redirection ouverte).
 */
const CONTROLE = /[\u0000-\u001f\u007f]/; // eslint-disable-line no-control-regex
const AUTORISES = /^\/(biblio(\/|\?|$)|api\/oidc\/interaction\/[A-Za-z0-9_-]+$)/;

export const cheminSuivantSur = (valeur) => {
    if (typeof valeur !== 'string') return null;
    if (!AUTORISES.test(valeur)) return null;
    if (valeur.includes('//') || valeur.includes('\\') || CONTROLE.test(valeur)) return null;
    return valeur;
};
