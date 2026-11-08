/** Moteur « triage » : classement d'incidents selon la grille portée × données × statut. */
import { entierEntre, nombre, MULT_DATA, MULT_STATUT, niveauDuScore } from './_aides.js';

export default {
    valider(cles, reponse) {
        return cles.length === 1 && Array.isArray(reponse.severites)
            && reponse.severites.length === 4 && reponse.severites.every((s) => entierEntre(s, 1, 4));
    },
    evaluer(defi, { severites }) {
        const problemes = [];
        const evenements = defi.evenements.map((evt, i) => {
            const score = evt.portee * MULT_DATA[evt.donnees] * MULT_STATUT[evt.statut];
            const attendu = niveauDuScore(score);
            const donne = severites[i];
            return { id: evt.id, portee: evt.portee, donnees: evt.donnees, statut: evt.statut, score, attendu, donne, correct: donne === attendu };
        });
        evenements.forEach((e, i) => { if (!e.correct) problemes.push({ code: 'triage', valeurs: { index: i + 1, attendu: e.attendu, donne: e.donne } }); });
        return { ok: !problemes.length, problemes, evenements };
    },
    formulaire(valeurs) {
        return { severites: [0, 1, 2, 3].map((i) => nombre(valeurs[`evt${i}`])) };
    },
};
