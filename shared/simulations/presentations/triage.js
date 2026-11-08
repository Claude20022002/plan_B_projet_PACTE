/** Présentation du moteur « triage » : incidents, scores de criticité et niveau attendu. */
export default {
    champs(defi, t) {
        return (defi?.evenements ?? []).map((evt, i) => ({
            cle: `evt${i}`, label: t('evtChamp', { n: i + 1, id: evt.id }), min: 1, max: 4, aide: t('triageAide'),
        }));
    },
    tableaux(defi, resultat, t, langue, bilingue) {
        const evenements = defi.evenements.map((evt, i) => [
            evt.id, bilingue(evt.titre), evt.portee, t(evt.donnees), t(evt.statut),
            ...(resultat ? [resultat.evenements[i].score, t(`niveau${resultat.evenements[i].attendu}`), resultat.evenements[i].correct ? t('oui') : t('non')] : []),
        ]);
        return [{
            titre: t('donnees'),
            colonnes: [t('evt'), t('evtTitre'), t('portee'), t('sensibilite'), t('statut'), ...(resultat ? [t('scoreLabel'), t('attendu'), t('obtenu')] : [])],
            lignes: evenements,
        }];
    },
    resume(defi, resultat, t) {
        return t('bilanTriage', {
            correct: resultat.evenements.filter((e) => e.correct).length, total: resultat.evenements.length,
        });
    },
};
