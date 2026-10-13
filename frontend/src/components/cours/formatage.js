/** Libellés de la maquette qui dépendent de la langue : `t` est la fonction de traduction. */
export const libelleSeance = (t, n) => (Number(n) === 2 ? t('ref.curriculum.halfDay') : t('ref.curriculum.slots', { count: Number(n) }));

export const rythme = (t, c) => {
    if (!c.semaine_debut && !c.seances_par_semaine) return '-';
    const semaines = c.semaine_debut ? t('ref.curriculum.weeksRange', { from: c.semaine_debut, to: c.semaine_fin || c.semaine_debut }) : '';
    const parSemaine = c.seances_par_semaine ? t('ref.curriculum.perWeek', { count: c.seances_par_semaine }) : '';
    return [semaines, parSemaine].filter(Boolean).join(' · ');
};

export const volumeTotal = (m) => m.composantes.reduce((total, c) => total + (Number(c.volume_heures) || 0), 0);
