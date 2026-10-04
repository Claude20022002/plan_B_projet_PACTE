/**
 * Retour après connexion vers un autre service de la plateforme (StudyLib sous /biblio) :
 * seul un chemin interne de /biblio est accepté. Une URL absolue, « //hôte », une barre
 * oblique inverse, un caractère de contrôle ou un autre préfixe sont ignorés (pas de
 * redirection ouverte).
 */
const CONTROLE = /[\u0000-\u001f\u007f]/; // eslint-disable-line no-control-regex

export const cheminSuivantSur = (valeur) => {
    if (typeof valeur !== 'string') return null;
    if (!/^\/biblio(\/|\?|$)/.test(valeur)) return null;
    if (valeur.includes('//') || valeur.includes('\\') || CONTROLE.test(valeur)) return null;
    return valeur;
};
