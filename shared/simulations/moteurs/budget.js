/** Moteur « budget » : modèle de coût linéaire (fixe + unité × qté) sous budget et couverture. */
import { entier, arrondi, nombre } from './_aides.js';

export default {
    valider(cles, reponse) {
        return cles.length === 1 && Array.isArray(reponse.quantites)
            && reponse.quantites.length === 4 && reponse.quantites.every((q) => entier(q, 999));
    },
    evaluer(defi, { quantites }) {
        const problemes = [];
        const lignes = defi.lignes.map((l, i) => ({ ...l, quantite: quantites[i], cout: l.fixe + l.unite * quantites[i] }));
        const total = lignes.reduce((s, l) => s + l.cout, 0);
        if (total > defi.budget) problemes.push({ code: 'depassement', valeurs: { total, max: defi.budget } });
        const couverture = Math.min(...lignes.map((l) => l.quantite));
        if (couverture < defi.couvertureMin) problemes.push({ code: 'couverture', valeurs: { min: defi.couvertureMin, couverture } });
        if (total / couverture > defi.couteUnitaireMax) {
            problemes.push({ code: 'cout_unitaire', valeurs: { unitaire: arrondi(total / couverture), max: defi.couteUnitaireMax } });
        }
        return { ok: !problemes.length, problemes, lignes, total, couverture };
    },
    formulaire(valeurs) {
        return { quantites: [0, 1, 2, 3].map((i) => nombre(valeurs[`poste${i}`])) };
    },
};
