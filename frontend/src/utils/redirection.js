/**
 * Retour après connexion vers un autre service de la plateforme : un chemin interne de
 * StudyLib (/biblio), la reprise d'une connexion OpenID Connect en cours (ClassQuiz,
 * /api/oidc/interaction/<uid>, chemin exact), ou le QR de l'appel scanné avec l'appareil
 * photo (/presence?c=<code>, I1), ou le QR d'un quiz du Studio (/quiz/code/<code>), ou l'écran
 * projeté de l'appel ouvert dans une fenêtre sans session (/appel/<id>/projection). Une URL
 * absolue, « //hôte », une barre oblique inverse, un caractère de contrôle ou un autre préfixe sont
 * ignorés (pas de redirection ouverte).
 */
const CONTROLE = /[\u0000-\u001f\u007f]/; // eslint-disable-line no-control-regex
const AUTORISES = /^\/(biblio(\/|\?|$)|api\/oidc\/interaction\/[A-Za-z0-9_-]+$|presence\?c=[A-Za-z0-9._%-]+$|quiz\/code\/[A-Z0-9]{4,8}$|appel\/\d{1,10}\/projection$)/;

export const cheminSuivantSur = (valeur) => {
    if (typeof valeur !== 'string') return null;
    if (!AUTORISES.test(valeur)) return null;
    if (valeur.includes('//') || valeur.includes('\\') || CONTROLE.test(valeur)) return null;
    return valeur;
};
