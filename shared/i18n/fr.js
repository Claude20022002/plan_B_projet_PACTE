/**
 * Traductions partagées par le web et l'application mobile (espaces status et board).
 * Chaque application les complète de ses propres espaces.
 */
const partage = {
  status: {
    planifie: 'Planifiée',
    confirme: 'Confirmée',
    reporte: 'Reportée',
    annule: 'Annulée',
    realise: 'Réalisée',
    live: 'En cours',
    next: 'Prochaine',
  },
  board: {
    title: 'Mes séances',
    titleTeacher: 'Mes séances',
    titleCampus: 'Départs du jour',
    time: 'Heure',
    course: 'Cours',
    room: 'Salle',
    building: 'Bât.',
    group: 'Groupe',
    teacher: 'Enseignant',
    status: 'Statut',
    floor: 'Étage {{floor}}',
    supports_one: 'Support du cours ({{count}})',
    supports_other: 'Supports du cours ({{count}})',
    startsIn: 'Commence dans {{duration}}',
    endsIn: 'Se termine dans {{duration}}',
    startedAgo: 'En cours',
    noSessionsTitle: 'Aucune séance à venir',
    noSessionsBody: "Votre emploi du temps ne contient pas de séance dans les prochains jours. Les changements apparaîtront ici dès qu'ils seront publiés.",
    changed: 'Modifiée',
    previously: 'Avant : {{value}}',
    weekTitle: 'Semaine du {{date}}',
    nextDay: '{{day}}',
    sessionsCount_one: '{{count}} séance',
    sessionsCount_other: '{{count}} séances',
    confirm: 'Confirmer',
    confirmed: 'Confirmée',
    requestReport: 'Demander un report',
    openTimetable: "Voir l'emploi du temps",
    changesTitle: 'Changements récents',
    noChanges: "Aucun changement depuis votre dernière visite.",
    confirmDone: 'Séance confirmée.',
    confirmError: 'La confirmation a échoué. Réessayez.',
  },
};

export default partage;
