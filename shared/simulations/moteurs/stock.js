/** Moteur « stock » : réapprovisionnement sur trois jours (capacité, délai, budget). */
import { entier, nombre } from './_aides.js';

export default {
    valider(cles, reponse) {
        return cles.length === 1 && Array.isArray(reponse.commandes)
            && reponse.commandes.length === 3 && [0, 1, 2].every((i) => entier(reponse.commandes[i], 100));
    },
    evaluer(defi, { commandes }) {
        let disponible = defi.initial;
        const problemes = [];
        const jours = defi.demandes.map((demande, index) => {
            const ouverture = disponible;
            const reception = commandes[index - defi.delai] ?? 0;
            const avant = ouverture + reception;
            const manque = Math.max(0, demande - avant);
            // La demande non servie est perdue, jamais convertie en stock négatif reporté au lendemain.
            disponible = Math.max(0, avant - demande);
            if (avant > defi.capacite) problemes.push({ code: 'capacity', valeurs: { day: index + 1, max: defi.capacite } });
            if (manque) problemes.push({ code: 'shortage', valeurs: { day: index + 1, count: manque } });
            return { jour: index + 1, ouverture, reception, demande, fermeture: disponible, manque };
        });
        const cout = commandes.reduce((s, n) => s + n, 0) * defi.prix;
        const transit = commandes.filter((_, i) => i + defi.delai >= defi.demandes.length).reduce((s, n) => s + n, 0);
        if (cout > defi.budget) problemes.push({ code: 'budget', valeurs: { max: defi.budget } });
        if (disponible > defi.finalMax) problemes.push({ code: 'remaining', valeurs: { max: defi.finalMax } });
        if (transit) problemes.push({ code: 'transit' });
        return { ok: !problemes.length, problemes, jours, cout, transit, restant: disponible };
    },
    formulaire(valeurs) {
        return { commandes: [0, 1, 2].map((i) => nombre(valeurs[`jour${i}`])) };
    },
};
