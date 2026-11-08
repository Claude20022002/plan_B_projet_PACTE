/** Moteur « seuil » : réglage d'un seuil de détection et métriques de la matrice de confusion. */
import { entier, nombre } from './_aides.js';

export default {
    valider(cles, reponse) {
        return cles.length === 1 && entier(reponse.seuil, 100);
    },
    evaluer(defi, { seuil: limite }) {
        let vp = 0; let fp = 0; let vn = 0; let fn = 0;
        const observations = defi.observations.map(([score, vrai]) => {
            const predit = score >= limite;
            if (predit && vrai) vp++;
            else if (predit) fp++;
            else if (vrai) fn++;
            else vn++;
            return { score, vrai: Boolean(vrai), predit };
        });
        // Une précision indéfinie est explicite : afficher 100 % sans aucune alerte tromperait.
        const precision = vp + fp ? 100 * vp / (vp + fp) : null;
        const rappel = vp + fn ? 100 * vp / (vp + fn) : null;
        const cout = fp * defi.coutFP + fn * defi.coutFN;
        const problemes = [];
        if (precision === null || precision < defi.precisionMin) problemes.push({ code: 'precision', valeurs: { min: defi.precisionMin } });
        if (rappel === null || rappel < defi.rappelMin) problemes.push({ code: 'recall', valeurs: { min: defi.rappelMin } });
        if (cout > defi.coutMax) problemes.push({ code: 'cost', valeurs: { max: defi.coutMax } });
        return { ok: !problemes.length, problemes, observations, vp, fp, vn, fn, precision, rappel, cout };
    },
    formulaire(valeurs) {
        return { seuil: nombre(valeurs.seuil) };
    },
};
