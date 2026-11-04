import {
  LocalLibrary,
  MenuBook,
  Campaign,
  Apartment,
  AssignmentInd,
  BookOnline,
  FactCheck,
  Healing,
  Print,
  Timeline,
  Checklist,
  AutoAwesome,
  Event,
  Hub,
  Tune,
  Palette,
  Book,
  CalendarMonth,
  Category,
  EventRepeat,
  Groups,
  Insights,
  PhonelinkLock,
  Policy,
  ManageAccounts,
  MeetingRoom,
  Notifications,
  People,
  PersonOutline,
  School,
  SportsEsports,
  ViewWeek,
  WarningAmber,
  DepartureBoard as BoardIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { estResponsable } from '../../utils/droits';
import { ANNONCES_ENSEIGNANTS_ACTIVES, SURVEILLANCES_ACTIVES } from '../../../../shared/fonctions.js';

/*
 * Navigation de Planner, par rôle : le menu latéral, les onglets du bas sur téléphone, et le titre
 * de chaque page (en-tête et onglet du navigateur). Sorti de DashboardLayout, qui l'affiche.
 */

/** Navigation par rôle : sections (libellé) et entrées (icône, chemin, clé de traduction) */
export const navigationFor = (user) => {
  const role = user?.role;
  if (role === 'admin') {
    return [
      {
        items: [
          { key: 'nav.dashboard', icon: <BoardIcon />, path: '/dashboard/admin' },
          { key: 'nav.announcements', icon: <Campaign />, path: '/annonces' },
        ],
      },
      {
        section: 'nav.planning',
        items: [
          { key: 'nav.preparation', icon: <Checklist />, path: '/gestion/preparation' },
          // Une entrée pour les trois vues des séances : grille, liste, mois (onglets dans la page)
          { key: 'nav.timetables', icon: <ViewWeek />, path: '/gestion/emplois-du-temps', aussi: ['/gestion/affectations', '/emploi-du-temps/mensuel'] },
          { key: 'nav.reports', icon: <EventRepeat />, path: '/gestion/demandes-report' },
          { key: 'nav.conflicts', icon: <WarningAmber />, path: '/gestion/conflits' },
          { key: 'nav.generation', icon: <AutoAwesome />, path: '/gestion/generation-automatique' },
          { key: 'nav.incidents', icon: <Healing />, path: '/gestion/imprevus' },
          { key: 'nav.bookings', icon: <BookOnline />, path: '/reservations' },
          { key: 'nav.exams', icon: <FactCheck />, path: '/gestion/examens' },
          ...(SURVEILLANCES_ACTIVES ? [{ key: 'nav.myInvigilations', icon: <FactCheck />, path: '/mes-examens' }] : []),
          { key: 'nav.tracking', icon: <Timeline />, path: '/gestion/suivi' },
          { key: 'nav.attendanceReports', icon: <PhonelinkLock />, path: '/gestion/signalements-presence' },
          { key: 'nav.statistics', icon: <Insights />, path: '/statistiques' },
        ],
      },
      {
        section: 'nav.academic',
        items: [
          { key: 'nav.programs', icon: <Category />, path: '/gestion/filieres' },
          { key: 'nav.groups', icon: <Groups />, path: '/gestion/groupes' },
          { key: 'nav.courses', icon: <Book />, path: '/gestion/cours' },
          { key: 'nav.teaching', icon: <Hub />, path: '/gestion/enseignements' },
        ],
      },
      {
        section: 'nav.people',
        items: [
          { key: 'nav.users', icon: <ManageAccounts />, path: '/gestion/utilisateurs' },
          { key: 'nav.securityLog', icon: <Policy />, path: '/gestion/journal-securite' },
          { key: 'nav.teachers', icon: <School />, path: '/gestion/enseignants' },
          { key: 'nav.students', icon: <People />, path: '/gestion/etudiants' },
        ],
      },
      {
        section: 'nav.establishment',
        items: [
          { key: 'nav.calendar', icon: <Event />, path: '/gestion/calendrier' },
          { key: 'nav.campus', icon: <Apartment />, path: '/gestion/campus' },
          { key: 'nav.rooms', icon: <MeetingRoom />, path: '/gestion/salles' },
          { key: 'nav.slots', icon: <CalendarMonth />, path: '/gestion/creneaux' },
          { key: 'nav.planningSettings', icon: <Tune />, path: '/gestion/parametres-planning' },
          { key: 'nav.identity', icon: <Palette />, path: '/gestion/identite' },
        ],
      },
    ];
  }
  if (role === 'enseignant') {
    const sections = [
      {
        items: [
          { key: 'nav.board', icon: <BoardIcon />, path: '/dashboard/enseignant' },
          // Annonces aux classes : pas d'entrée tant que l'envoi est fermé (lot EC-5), sauf pour le
          // responsable de filière, qui écrit à sa filière même envoi fermé (relecture de A)
          ...(ANNONCES_ENSEIGNANTS_ACTIVES || estResponsable(user) ? [{ key: 'nav.announcements', icon: <Campaign />, path: '/annonces' }] : []),
          { key: 'nav.timetable', icon: <ViewWeek />, path: '/emploi-du-temps/enseignant' },
          { key: 'nav.myClasses', icon: <Groups />, path: '/mes-classes' },
          { key: 'nav.myQuizzes', icon: <QuizIcon />, path: '/studio-quiz' },
          // Services, disponibilités et demandes de report : une rubrique à trois onglets (lot E-8)
          { key: 'nav.myService', icon: <AssignmentInd />, path: '/mes-services', aussi: ['/disponibilites', '/demandes-report'] },
          // La Bibliothèque s'ouvre sur ses documents : Planner est déjà le tableau de bord
          { key: 'nav.library', icon: <LocalLibrary />, path: '/biblio/documents' },
          { key: 'nav.games', icon: <SportsEsports />, path: '/jeux' },
        ],
      },
    ];
    // Responsable de filière : préparation de ses filières
    if (estResponsable(user)) {
      sections.push({
        section: 'nav.preparation',
        items: [
          { key: 'nav.preparation', icon: <Checklist />, path: '/gestion/preparation' },
          { key: 'nav.courses', icon: <Book />, path: '/gestion/cours' },
          { key: 'nav.groups', icon: <Groups />, path: '/gestion/groupes' },
          { key: 'nav.teaching', icon: <Hub />, path: '/gestion/enseignements' },
          { key: 'nav.tracking', icon: <Timeline />, path: '/gestion/suivi' },
          { key: 'nav.monthly', icon: <Print />, path: '/emploi-du-temps/mensuel' },
        ],
      });
    }
    return sections;
  }
  return [
    {
      items: [
        { key: 'nav.board', icon: <BoardIcon />, path: '/dashboard/etudiant' },
        { key: 'nav.announcements', icon: <Campaign />, path: '/annonces' },
        { key: 'nav.timetable', icon: <ViewWeek />, path: '/emploi-du-temps/etudiant' },
        { key: 'nav.myExams', icon: <FactCheck />, path: '/mes-examens' },
        // Supports de ses classes (Planner), puis documents de toute l'école (Bibliothèque)
        { key: 'nav.myCourses', icon: <MenuBook />, path: '/mes-cours' },
        { key: 'nav.takeQuiz', icon: <QuizIcon />, path: '/quiz' },
        { key: 'nav.library', icon: <LocalLibrary />, path: '/biblio/documents' },
        // Pas d'« Activités » pour l'étudiant : quiz et jeux se rejoignent par leur code, dans « Quiz »
      ],
    },
  ];
};

/** Onglets du bas sur téléphone (étudiant et enseignant) */
export const bottomTabsFor = (role) => {
  const base = role === 'enseignant' ? 'enseignant' : 'etudiant';
  const tabs = [
    { key: 'nav.board', icon: <BoardIcon />, path: `/dashboard/${base}` },
    { key: 'nav.week', icon: <ViewWeek />, path: `/emploi-du-temps/${base}` },
  ];
  // Enseignant : ses classes (appel, devoirs, messages) ; « Mes séances » reste dans le menu
  if (role === 'enseignant') tabs.push({ key: 'nav.myClasses', icon: <Groups />, path: '/mes-classes' });
  tabs.push(
    { key: 'nav.alerts', icon: <Notifications />, path: '/notifications', badge: true },
    { key: 'nav.account', icon: <PersonOutline />, path: '/parametres' }
  );
  return tabs;
};

// Rubriques dont les sous-pages gardent le titre et l'entrée de menu active
export const RUBRIQUES_PARENTES = ['/jeux', '/annonces', '/mes-classes', '/mes-cours'];

const TITLE_KEYS = {
  '/dashboard/admin': 'nav.dashboard',
  '/dashboard/enseignant': 'nav.board',
  '/dashboard/etudiant': 'nav.board',
  '/gestion/utilisateurs': 'nav.users',
  '/gestion/enseignants': 'nav.teachers',
  '/gestion/etudiants': 'nav.students',
  '/gestion/filieres': 'nav.programs',
  '/gestion/groupes': 'nav.groups',
  '/gestion/salles': 'nav.rooms',
  '/gestion/cours': 'nav.courses',
  '/gestion/creneaux': 'nav.slots',
  '/gestion/affectations': 'nav.sessions',
  '/gestion/conflits': 'nav.conflicts',
  '/gestion/demandes-report': 'nav.reports',
  '/gestion/generation-automatique': 'nav.generation',
  '/gestion/emplois-du-temps': 'nav.timetables',
  '/gestion/campus': 'nav.campus',
  '/gestion/calendrier': 'nav.calendar',
  '/gestion/parametres-planning': 'nav.planningSettings',
  '/gestion/identite': 'nav.identity',
  '/gestion/enseignements': 'nav.teaching',
  '/statistiques': 'nav.statistics',
  '/notifications': 'nav.notifications',
  '/presence': 'nav.presence',
  '/annonces': 'nav.announcements',
  '/parametres': 'nav.settings',
  '/mes-affectations': 'nav.mySessions',
  '/mes-classes': 'nav.myClasses',
  '/studio-quiz': 'nav.myQuizzes',
  '/quiz': 'nav.takeQuiz',
  '/mes-cours': 'nav.myCourses',
  '/mes-services': 'nav.myService',
  '/reservations': 'nav.bookings',
  '/mes-examens': 'nav.myExams',
  '/gestion/examens': 'nav.exams',
  '/gestion/imprevus': 'nav.incidents',
  '/gestion/suivi': 'nav.tracking',
  '/gestion/signalements-presence': 'nav.attendanceReports',
  '/gestion/journal-securite': 'nav.securityLog',
  '/gestion/preparation': 'nav.preparation',
  '/emploi-du-temps/mensuel': 'nav.monthly',
  '/disponibilites': 'nav.myService',
  '/demandes-report': 'nav.myService',
  '/emploi-du-temps/enseignant': 'nav.timetable',
  '/emploi-du-temps/etudiant': 'nav.timetable',
  '/jeux': 'nav.games',
  '/jeux/terminal-linux': 'nav.games',
};

/** Rend la clé de traduction du titre d'une adresse : la sienne, celle de sa rubrique parente, ou le nom de l'application. */
export const cleDuTitre = (chemin) => {
  const parente = RUBRIQUES_PARENTES.find((p) => chemin.startsWith(`${p}/`));
  return TITLE_KEYS[chemin] || TITLE_KEYS[parente] || 'app.name';
};
