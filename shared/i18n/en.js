/**
 * Traductions partagées par le web et l'application mobile (espaces status et board).
 * Chaque application les complète de ses propres espaces.
 */
const partage = {
  status: {
    planifie: 'Scheduled',
    confirme: 'Confirmed',
    reporte: 'Rescheduled',
    annule: 'Cancelled',
    realise: 'Done',
    live: 'Now',
    next: 'Next',
  },
  board: {
    title: 'My sessions',
    titleTeacher: 'My sessions',
    titleCampus: "Today's departures",
    time: 'Time',
    course: 'Course',
    room: 'Room',
    building: 'Bldg',
    group: 'Group',
    teacher: 'Teacher',
    status: 'Status',
    floor: 'Floor {{floor}}',
    supports_one: 'Course material ({{count}})',
    supports_other: 'Course materials ({{count}})',
    // duration comes from relativeTo, which already says « in » ("in 20 hours")
    startsIn: 'Starts {{duration}}',
    endsIn: 'Ends in {{duration}}',
    startedAgo: 'In progress',
    noSessionsTitle: 'No upcoming sessions',
    noSessionsBody: 'Your timetable has no sessions in the next few days. Changes will appear here as soon as they are published.',
    changed: 'Changed',
    previously: 'Was: {{value}}',
    weekTitle: 'Week of {{date}}',
    nextDay: '{{day}}',
    sessionsCount_one: '{{count}} session',
    sessionsCount_other: '{{count}} sessions',
    confirm: 'Confirm',
    confirmed: 'Confirmed',
    requestReport: 'Request a reschedule',
    launchQuiz: 'Launch a quiz',
    openTimetable: 'Open timetable',
    changesTitle: 'Recent changes',
    noChanges: 'Nothing has changed since your last visit.',
    confirmDone: 'Session confirmed.',
    confirmError: 'Confirmation failed. Please try again.',
  },
};

export default partage;
