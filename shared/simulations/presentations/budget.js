/** Présentation du moteur « budget » : lignes de coût, quantités allouées et totaux. */
export default {
    champs(defi, t) {
        return (defi?.lignes ?? []).map((l, i) => ({
            cle: `poste${i}`, label: t('budgetChamp', { n: i + 1, nom: l.nom, fixe: l.fixe, unite: l.unite }), min: 0, max: 999, aide: t('budgetAide'),
        }));
    },
    tableaux(defi, resultat, t) {
        return [{
            titre: t('budgetLignes'),
            colonnes: [t('budgetNom'), t('budgetFixe'), t('budgetUnite'), ...(resultat ? [t('budgetQuantite'), t('budgetCout')] : [])],
            lignes: resultat ? resultat.lignes.map((l) => [l.nom, l.fixe, l.unite, l.quantite, l.cout])
                : defi.lignes.map((l) => [l.nom, l.fixe, l.unite]),
        }];
    },
    resume(defi, resultat, t) {
        return t('budgetResume', { total: resultat.total, couverture: resultat.couverture, budgetMax: defi.budget });
    },
};
