/**
 * queryKeys.js — Fabrique de clés React Query centralisée.
 *
 * Convention hiérarchique :
 *   [domaine]                         → invalide TOUT le domaine
 *   [domaine, 'list', params]         → listes paginées / filtrées
 *   [domaine, 'detail', id]           → détail d'un enregistrement
 *   [domaine, 'sub', subId, 'list']   → sous-ressources
 *
 * Pourquoi une fabrique ?
 *   - Pas de typo dans les strings
 *   - Refactoring en un seul endroit
 *   - Testable unitairement
 *   - Prêt TypeScript (générics futurs)
 *
 * Usage :
 *   import { QK } from '../_shared/queryKeys';
 *   useQuery({ queryKey: QK.salles.list({ page: 1 }) })
 *   qc.invalidateQueries({ queryKey: QK.salles.all() })
 */

export const QK = {
  // ── Auth ──────────────────────────────────────────────────────────────
  auth: {
    me: () => ['auth', 'me'],
  },

  // ── Utilisateurs ──────────────────────────────────────────────────────
  users: {
    all:    ()       => ['users'],
    lists:  ()       => ['users', 'list'],
    list:   (p)      => ['users', 'list', p ?? {}],
    detail: (id)     => ['users', 'detail', id],
  },

  // ── Enseignants ───────────────────────────────────────────────────────
  enseignants: {
    all:    ()   => ['enseignants'],
    list:   (p)  => ['enseignants', 'list', p ?? {}],
    detail: (id) => ['enseignants', 'detail', id],
  },

  // ── Étudiants ─────────────────────────────────────────────────────────
  etudiants: {
    all:    ()   => ['etudiants'],
    list:   (p)  => ['etudiants', 'list', p ?? {}],
    detail: (id) => ['etudiants', 'detail', id],
  },

  // ── Filières ──────────────────────────────────────────────────────────
  filieres: {
    all:    ()   => ['filieres'],
    list:   (p)  => ['filieres', 'list', p ?? {}],
    detail: (id) => ['filieres', 'detail', id],
  },

  // ── Groupes ───────────────────────────────────────────────────────────
  groupes: {
    all:    ()   => ['groupes'],
    list:   (p)  => ['groupes', 'list', p ?? {}],
    detail: (id) => ['groupes', 'detail', id],
  },

  // ── Salles ────────────────────────────────────────────────────────────
  salles: {
    all:         ()      => ['salles'],
    lists:       ()      => ['salles', 'list'],
    list:        (p)     => ['salles', 'list', p ?? {}],
    detail:      (id)    => ['salles', 'detail', id],
    disponibles: (p)     => ['salles', 'disponibles', p ?? {}],
  },

  // ── Cours ─────────────────────────────────────────────────────────────
  cours: {
    all:    ()   => ['cours'],
    list:   (p)  => ['cours', 'list', p ?? {}],
    detail: (id) => ['cours', 'detail', id],
  },

  // ── Créneaux ──────────────────────────────────────────────────────────
  creneaux: {
    all:    ()   => ['creneaux'],
    list:   (p)  => ['creneaux', 'list', p ?? {}],
    detail: (id) => ['creneaux', 'detail', id],
  },

  // ── Affectations ──────────────────────────────────────────────────────
  affectations: {
    all:          ()          => ['affectations'],
    lists:        ()          => ['affectations', 'list'],
    list:         (p)         => ['affectations', 'list', p ?? {}],
    detail:       (id)        => ['affectations', 'detail', id],
    byEnseignant: (id, p)     => ['affectations', 'enseignant', id, p ?? {}],
    byGroupe:     (id, p)     => ['affectations', 'groupe', id, p ?? {}],
  },

  // ── Conflits ──────────────────────────────────────────────────────────
  conflits: {
    all:        ()   => ['conflits'],
    list:       (p)  => ['conflits', 'list', p ?? {}],
    detail:     (id) => ['conflits', 'detail', id],
    nonResolus: (p)  => ['conflits', 'non-resolus', p ?? {}],
  },

  // ── Notifications ─────────────────────────────────────────────────────
  notifications: {
    all:     ()       => ['notifications'],
    byUser:  (uid)    => ['notifications', 'user', uid],
    nonLues: (uid)    => ['notifications', 'user', uid, 'non-lues'],
  },

  // ── Statistiques ──────────────────────────────────────────────────────
  statistiques: {
    all:         ()   => ['statistiques'],
    dashboard:   (p)  => ['statistiques', 'dashboard', p ?? {}],
    kpis:        (p)  => ['statistiques', 'kpis', p ?? {}],
    salles:      (p)  => ['statistiques', 'salles', p ?? {}],
    enseignants: (p)  => ['statistiques', 'enseignants', p ?? {}],
    groupes:     (p)  => ['statistiques', 'groupes', p ?? {}],
  },

  // ── Disponibilités ────────────────────────────────────────────────────
  disponibilites: {
    all:            ()   => ['disponibilites'],
    byEnseignant:   (id) => ['disponibilites', 'enseignant', id],
  },

  // ── Demandes de report ────────────────────────────────────────────────
  demandesReport: {
    all:    ()   => ['demandesReport'],
    list:   (p)  => ['demandesReport', 'list', p ?? {}],
    detail: (id) => ['demandesReport', 'detail', id],
  },
};
