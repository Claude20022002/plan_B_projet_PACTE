/** Moteur « sprint » : sélection de backlog sous capacité, dépendances et valeur minimale. */
export default {
    valider(cles, reponse) {
        return cles.length === 1 && Array.isArray(reponse.choix)
            && reponse.choix.length === 5 && reponse.choix.every((c) => c === 0 || c === 1);
    },
    evaluer(defi, { choix }) {
        const problemes = [];
        const pris = defi.backlog.filter((_, i) => choix[i] === 1);
        const obligation = defi.backlog.map((it, i) => ({ it, i })).filter(({ it }) => it.obligatoire).filter(({ i }) => choix[i] !== 1);
        obligation.forEach(({ it }) => problemes.push({ code: 'obligatoire', valeurs: { nom: it.nom } }));
        const charge = pris.reduce((s, it) => s + it.charges, 0);
        const valeur = pris.reduce((s, it) => s + it.valeur, 0);
        if (charge > defi.capacite) problemes.push({ code: 'charge', valeurs: { charge, max: defi.capacite } });
        if (valeur < defi.valeurMin) problemes.push({ code: 'valeur', valeurs: { valeur, min: defi.valeurMin } });
        defi.backlog.forEach((it, i) => {
            if (choix[i] !== 1 || it.dependsOn == null) return;
            if (choix[it.dependsOn] !== 1) problemes.push({ code: 'dependance', valeurs: { nom: it.nom, avant: defi.backlog[it.dependsOn].nom } });
        });
        const lignes = defi.backlog.map((it, i) => ({ ...it, pris: choix[i] === 1 }));
        return { ok: !problemes.length, problemes, lignes, charge, valeur, nbPris: pris.length };
    },
    formulaire(valeurs) {
        const b = (v) => (v === '1' ? 1 : v === '0' ? 0 : null);
        return { choix: [0, 1, 2, 3, 4].map((i) => b(valeurs[`item${i}`])) };
    },
};
