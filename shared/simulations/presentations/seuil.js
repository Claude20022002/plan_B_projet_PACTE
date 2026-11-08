/** Présentation du moteur « seuil » : observations, matrice de confusion et métriques. */
export default {
    champs(defi, t) {
        return [{ cle: 'seuil', label: t('seuil') }];
    },
    tableaux(defi, resultat, t) {
        const tables = [{
            titre: t('donnees'), colonnes: [t('piece'), t('score'), t('reel'), ...(resultat ? [t('prediction')] : [])],
            lignes: defi.observations.map(([score, vrai], i) => [i + 1, score, t(vrai ? 'defaut' : 'conforme'), ...(resultat ? [t(resultat.observations[i].predit ? 'alerte' : 'aucune')] : [])]),
        }];
        if (resultat) tables.push({
            titre: t('matrice'), colonnes: [t('vp'), t('fp'), t('vn'), t('fn')], lignes: [[resultat.vp, resultat.fp, resultat.vn, resultat.fn]],
        });
        return tables;
    },
    resume(defi, resultat, t) {
        const pourcent = (n) => (n === null ? t('indefini') : `${Math.round(n * 10) / 10} %`);
        return `${t('precision')}: ${pourcent(resultat.precision)} · ${t('rappel')}: ${pourcent(resultat.rappel)} · ${t('cout')}: ${resultat.cout}`;
    },
};
