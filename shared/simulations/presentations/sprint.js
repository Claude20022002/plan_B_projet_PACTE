/** Présentation du moteur « sprint » : backlog, sélection et arbitrage charge/valeur. */
export default {
    champs(defi, t) {
        return (defi?.backlog ?? []).map((item, i) => ({
            cle: `item${i}`, label: t('sprintChamp', { n: i + 1, nom: item.nom }), min: 0, max: 1, aide: t('sprintAide'),
        }));
    },
    tableaux(defi, resultat, t) {
        return [{
            titre: t('sprintBacklog'),
            colonnes: [t('sprintNom'), t('sprintCharges'), t('sprintValeur'), t('sprintObligatoire'), ...(resultat ? [t('sprintPris')] : [])],
            lignes: resultat ? resultat.lignes.map((l) => [l.nom, l.charges, l.valeur, l.obligatoire ? t('oui') : t('non'), l.pris ? t('oui') : t('non')])
                : defi.backlog.map((it) => [it.nom, it.charges, it.valeur, it.obligatoire ? t('oui') : t('non')]),
        }];
    },
    resume(defi, resultat, t) {
        return t('sprintResume', { charge: resultat.charge, capacite: defi.capacite, valeur: resultat.valeur, valeurMin: defi.valeurMin, nbPris: resultat.nbPris });
    },
};
