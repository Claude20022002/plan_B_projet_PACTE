/** Présentation du moteur « sql » : fragments de clauses, positions attendues/obtenues. */
export default {
    champs(defi, t, langue, bilingue) {
        return (defi?.clauses ?? []).map((c, i) => ({
            cle: `clause${i}`, label: t('clauseChamp', { n: i + 1, frag: bilingue(c.texte) }), min: 1, max: 4, aide: t('sqlAide'),
        }));
    },
    tableaux(defi, resultat, t, langue, bilingue) {
        return [{
            titre: t('donnees'),
            colonnes: [t('fragment'), ...(resultat ? [t('attendu'), t('obtenu'), t('correctLabel')] : [])],
            lignes: defi.clauses.map((c, i) => [
                bilingue(c.texte),
                ...(resultat ? [resultat.fragments[i].attendu, resultat.fragments[i].position, resultat.fragments[i].correct ? t('oui') : t('non')] : []),
            ]),
        }];
    },
    resume(defi, resultat, t) {
        return t('bilanSql', {
            correct: resultat.fragments.filter((f) => f.correct).length, total: resultat.fragments.length,
        });
    },
};
