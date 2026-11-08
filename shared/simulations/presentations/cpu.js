/** Présentation du moteur « cpu » : ordonnancement, rendus et moyenne de rotation. */
export default {
    champs(defi, t) {
        return (defi?.processus ?? []).map((p, i) => ({
            cle: `cpu${i}`, label: t('cpuChamp', { n: i + 1 }), min: 0, max: 3, aide: t('cpuAide', { ordinal: i + 1 }),
        }));
    },
    tableaux(defi, resultat, t) {
        return [{
            titre: t('processeurOrdonnancement'),
            colonnes: [t('cpuRendu'), t('cpuArrivee'), t('cpuDuree'), t('cpuEcheance'), ...(resultat ? [t('cpuDebut'), t('cpuFin'), t('cpuRotation'), t('cpuAttente')] : [])],
            lignes: resultat ? resultat.rendu.map((r) => [r.nom, r.arrivee, r.duree, r.echeance, r.debut, r.fin, r.rotation, r.attente])
                : defi.processus.map((p) => [p.nom, p.arrivee, p.duree, p.echeance]),
        }];
    },
    resume(defi, resultat, t) {
        return t('cpuResume', { moyenne: resultat.moyenne, max: defi.moyenneMax, occupation: resultat.occupation });
    },
};
