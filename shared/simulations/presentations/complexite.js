/** Présentation du moteur « complexite » : extraits, classes Big-O attendues/obtenues. */
export default {
    champs(defi, t) {
        return (defi?.extraits ?? []).map((ex, i) => ({
            cle: `extrait${i}`, label: t('complexiteChamp', { n: i + 1, id: ex.id }), min: 1, max: 6, aide: t('complexiteAide'),
        }));
    },
    tableaux(defi, resultat, t, langue, bilingue) {
        return [{
            titre: t('donnees'),
            colonnes: [t('complexiteExtrait'), t('complexiteCode'), ...(resultat ? [t('attendu'), t('obtenu'), t('correctLabel')] : [])],
            lignes: defi.extraits.map((ex, i) => [
                bilingue(ex.titre), bilingue(ex.code),
                ...(resultat ? [t('classe' + resultat.extraits[i].attendu), t('classe' + resultat.extraits[i].donne), resultat.extraits[i].correct ? t('oui') : t('non')] : []),
            ]),
        }];
    },
    resume(defi, resultat, t) {
        return t('bilanComplexite', { correct: resultat.extraits.filter((e) => e.correct).length, total: resultat.extraits.length });
    },
};
