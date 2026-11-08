/** Présentation du moteur « stock » : commandes par jour, suivi des stocks et bilan. */
export default {
    champs(defi, t) {
        return [0, 1, 2].map((i) => ({ cle: `jour${i}`, label: t('commande', { day: i + 1 }) }));
    },
    tableaux(defi, resultat, t) {
        return [{
            titre: t('donnees'),
            colonnes: (resultat ? ['jour', 'ouverture', 'reception', 'demande', 'fermeture', 'manque'] : ['jour', 'demande']).map((c) => t(c)),
            lignes: resultat ? resultat.jours.map((j) => [j.jour, j.ouverture, j.reception, j.demande, j.fermeture, j.manque]) : defi.demandes.map((n, i) => [i + 1, n]),
        }];
    },
    resume(defi, resultat, t) {
        return t('bilanStock', resultat);
    },
};
