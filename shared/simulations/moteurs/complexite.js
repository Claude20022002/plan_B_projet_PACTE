/** Moteur « complexite » : classer des extraits d'algorithme par leur complexité asymptotique (Big-O). */
import { entierEntre, nombre } from './_aides.js';

/** Classe canonique dérivée du profil de boucle : règle métier, jamais une réponse tapée à la main. */
export const CLASSE_PAR_PROFIL = {
    constant: 1, logarithmique: 2, lineaire: 3, lineaire_log: 4, quadratique: 5, exponentiel: 6,
};

export default {
    valider(cles, reponse) {
        return cles.length === 1 && Array.isArray(reponse.classes)
            && reponse.classes.length === 4 && reponse.classes.every((c) => entierEntre(c, 1, 6));
    },
    evaluer(defi, { classes }) {
        const problemes = [];
        const extraits = defi.extraits.map((ex, i) => {
            const attendu = CLASSE_PAR_PROFIL[ex.profil];
            const donne = classes[i];
            return { id: ex.id, profil: ex.profil, attendu, donne, correct: donne === attendu };
        });
        extraits.forEach((e, i) => { if (!e.correct) problemes.push({ code: 'complexite', valeurs: { index: i + 1, attendu: e.attendu, donne: e.donne } }); });
        return { ok: !problemes.length, problemes, extraits };
    },
    formulaire(valeurs) {
        return { classes: [0, 1, 2, 3].map((i) => nombre(valeurs[`extrait${i}`])) };
    },
};
