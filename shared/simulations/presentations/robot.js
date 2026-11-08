/** Présentation du moteur « robot » : champ de programme, pas de tableau, résumé du trajet. */
export default {
    champs(defi, t) {
        return [{ cle: 'programme', label: t('programme'), texte: true }];
    },
    tableaux() {
        return [];
    },
    resume(defi, resultat, t) {
        return `${t('trajet')}: ${resultat.trajet.map(([x, y]) => `(${x + 1}, ${y + 1})`).join(' → ')}`;
    },
};
