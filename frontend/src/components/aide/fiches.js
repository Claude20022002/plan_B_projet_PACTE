/**
 * Fiches d'aide (plan espace-enseignant, lot G-1) : une question que l'on se pose, quelques étapes,
 * et la page où agir. Les textes sont dans les traductions (aide.fiches.<id>.titre, .etapes, .note).
 *  - roles : qui voit la fiche ;
 *  - theme : regroupement dans le panneau (aide.themes.<theme>) ;
 *  - pages : pages où la fiche est proposée en premier (début du chemin) ;
 *  - lien : page ouverte par « Y aller » ;
 *  - responsable : réservée aux responsables de filière.
 *  - devoirs : ne s'affiche que si les devoirs sont actifs (lot D-1).
 * Une fiche ne décrit que ce qui existe à l'écran : la mettre à jour avec la page qu'elle explique.
 * Devoirs masqués : les textes qui les citent ont une variante « _sansDevoirs » (CONTEXTE_DEVOIRS).
 */
import { DEVOIRS_ACTIFS } from '../../../../shared/fonctions.js';

export const FICHES = [
  // ── Administration ───────────────────────────────────────────────────────
  { id: 'adminDemarrer', roles: ['admin'], theme: 'annee', pages: ['/dashboard/admin', '/gestion/preparation'], lien: '/gestion/preparation' },
  { id: 'adminGenerer', roles: ['admin'], theme: 'annee', pages: ['/gestion/generation-automatique', '/gestion/enseignements'], lien: '/gestion/generation-automatique' },
  { id: 'adminConflits', roles: ['admin'], theme: 'annee', pages: ['/gestion/conflits', '/gestion/emplois-du-temps', '/gestion/affectations'], lien: '/gestion/conflits' },
  { id: 'adminPublierMois', roles: ['admin'], theme: 'annee', pages: ['/emploi-du-temps/mensuel', '/gestion/emplois-du-temps'], lien: '/emploi-du-temps/mensuel' },
  { id: 'adminImprevu', roles: ['admin'], theme: 'quotidien', pages: ['/gestion/imprevus', '/dashboard/admin'], lien: '/gestion/imprevus' },
  { id: 'adminReport', roles: ['admin'], theme: 'quotidien', pages: ['/gestion/demandes-report', '/dashboard/admin'], lien: '/gestion/demandes-report' },
  { id: 'adminAnnonce', roles: ['admin'], theme: 'quotidien', pages: ['/annonces'], lien: '/annonces' },
  { id: 'adminExamens', roles: ['admin'], theme: 'quotidien', pages: ['/gestion/examens', '/reservations'], lien: '/gestion/examens' },
  { id: 'adminHeures', roles: ['admin'], theme: 'quotidien', pages: ['/gestion/suivi', '/statistiques'], lien: '/gestion/suivi' },
  { id: 'adminComptes', roles: ['admin'], theme: 'comptes', pages: ['/gestion/utilisateurs', '/gestion/etudiants', '/gestion/enseignants'], lien: '/gestion/utilisateurs' },
  { id: 'adminMfa', roles: ['admin'], theme: 'comptes', pages: ['/gestion/utilisateurs', '/gestion/journal-securite'], lien: '/gestion/utilisateurs' },
  { id: 'adminTelephone', roles: ['admin'], theme: 'comptes', pages: ['/gestion/signalements-presence', '/gestion/etudiants'], lien: '/gestion/signalements-presence' },
  { id: 'adminSecurite', roles: ['admin'], theme: 'comptes', pages: ['/gestion/journal-securite'], lien: '/gestion/journal-securite' },

  // ── Enseignant ───────────────────────────────────────────────────────────
  { id: 'profAppel', roles: ['enseignant'], theme: 'seance', pages: ['/mes-classes', '/appel', '/dashboard/enseignant', '/mes-affectations'], lien: '/mes-classes' },
  { id: 'profRappel', roles: ['enseignant'], theme: 'seance', pages: ['/appel', '/mes-classes'], lien: '/mes-classes' },
  { id: 'profQuizDirect', roles: ['enseignant'], theme: 'seance', pages: ['/mes-classes', '/jeux', '/dashboard/enseignant'], lien: '/mes-classes' },
  { id: 'profQuizIa', roles: ['enseignant'], theme: 'classe', pages: ['/jeux', '/mes-classes'], lien: '/jeux' },
  { id: 'profDevoir', roles: ['enseignant'], devoirs: true, theme: 'classe', pages: ['/jeux', '/mes-classes'], lien: '/jeux' },
  // Les supports d'une classe se gèrent dans son espace (espace-de-cours.md, lots E-3 et E-9)
  { id: 'profSupports', roles: ['enseignant'], theme: 'classe', pages: ['/mes-classes'], lien: '/mes-classes' },
  { id: 'profReport', roles: ['enseignant'], theme: 'planning', pages: ['/mes-affectations', '/demandes-report', '/dashboard/enseignant', '/emploi-du-temps/enseignant'], lien: '/demandes-report' },
  { id: 'profAbsence', roles: ['enseignant'], theme: 'planning', pages: ['/disponibilites'], lien: '/disponibilites' },
  { id: 'profDispos', roles: ['enseignant'], theme: 'planning', pages: ['/disponibilites'], lien: '/disponibilites' },
  { id: 'profServices', roles: ['enseignant'], theme: 'planning', pages: ['/mes-services'], lien: '/mes-services' },
  { id: 'profResponsable', roles: ['enseignant'], responsable: true, theme: 'planning', pages: ['/gestion/preparation', '/gestion/suivi'], lien: '/gestion/preparation' },
  { id: 'profSecurite', roles: ['enseignant', 'admin'], theme: 'compte', pages: ['/parametres', '/securite'], lien: '/securite' },

  // ── Étudiant ─────────────────────────────────────────────────────────────
  { id: 'etuEdt', roles: ['etudiant'], theme: 'etudiant', pages: ['/dashboard/etudiant', '/emploi-du-temps'], lien: '/emploi-du-temps/etudiant' },
  { id: 'etuPresence', roles: ['etudiant'], theme: 'etudiant', pages: ['/presence', '/dashboard/etudiant'], lien: null },
  { id: 'etuDevoirs', roles: ['etudiant'], theme: 'etudiant', pages: ['/jeux'], lien: '/jeux' },
  { id: 'etuCours', roles: ['etudiant'], theme: 'etudiant', pages: ['/mes-cours', '/dashboard/etudiant'], lien: '/mes-cours' },
  { id: 'etuAnnonces', roles: ['etudiant'], theme: 'etudiant', pages: ['/annonces', '/notifications'], lien: '/annonces' },
];

/** Ordre des thèmes dans le panneau. */
export const THEMES = ['seance', 'classe', 'planning', 'annee', 'quotidien', 'comptes', 'compte', 'etudiant'];

/** Fiches visibles par cet utilisateur. */
export const fichesPour = (role, responsable = false) =>
  FICHES.filter((f) => f.roles.includes(role) && (!f.responsable || responsable) && (!f.devoirs || DEVOIRS_ACTIFS));

/** La fiche concerne-t-elle la page ouverte ? */
export const concernePage = (fiche, chemin) => fiche.pages.some((p) => chemin === p || chemin.startsWith(`${p}/`) || (p.length > 1 && chemin.startsWith(p)));

const sansAccents = (texte) =>
  String(texte)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Recherche : tous les mots saisis doivent se trouver dans le titre, les étapes ou la note. */
export const correspond = (texteFiche, recherche) => {
  const mots = sansAccents(recherche).split(/\s+/).filter(Boolean);
  const cible = sansAccents(texteFiche);
  return mots.every((mot) => cible.includes(mot));
};
