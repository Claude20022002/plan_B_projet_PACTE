/** Présentation du moteur « reseau » : affectation des appareils et capacités des switchs. */
export default {
    champs(defi, t) {
        return (defi?.appareils ?? []).map((app, i) => ({
            cle: `device${i}`, label: t('deviceChamp', { n: i + 1, nom: app.nom }), min: 0, max: Math.max(0, (defi.switches?.length ?? 1) - 1), aide: t('reseauAide'),
        }));
    },
    tableaux(defi, resultat, t) {
        return [{
            titre: t('donnees'),
            colonnes: [t('appareilLabel'), ...(resultat ? [t('switchAssignee')] : [])],
            lignes: defi.appareils.map((app, i) => [app.nom, ...(resultat ? [resultat.appareils[i].switchNom] : [])]),
        }, {
            titre: t('capacites'),
            colonnes: [t('switchLabel'), t('capaciteMax'), ...(resultat ? [t('occup')] : [])],
            lignes: defi.switches.map((sw, j) => [sw.nom, sw.capacite, ...(resultat ? [resultat.countByPort[j]] : [])]),
        }];
    },
    resume(defi, resultat, t) {
        return t('bilanReseau', {
            occupations: resultat.appareils.map((a) => `${a.nom}→${a.switchNom}`).join(', '),
            violation: resultat.problemes.length ? t('non') : t('oui'),
        });
    },
};
