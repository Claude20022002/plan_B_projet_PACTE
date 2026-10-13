/**
 * Familles de thème du site, chacune en clair et en nuit (DESIGN.md) :
 *   - planner  : cartes claires de HESTIM, nuit en ardoise, rail bleu marine ;
 *   - studylib : la bibliothèque StudyLib (mêmes valeurs que l'application : mobile/src/theme.js).
 * Une famille donne la palette du thème MUI (contexts/ThemeContext.jsx) et les variables CSS
 * qui habillent l'ancien panneau (ds.board) et le menu (ds.nav) sans toucher aux écrans.
 */

import { ds } from './tokens';

export const FAMILLES = ['planner', 'studylib'];

// Libellés en capitales condensées : en-têtes de colonnes, pastilles, surtitres
const libellePlanner = { fontFamily: ds.font.board, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' };
// Boutons et onglets en casse normale (DESIGN.md, Sentence Case Rule)
const boutonPlanner = { fontFamily: ds.font.body, fontWeight: 600, textTransform: 'none', letterSpacing: 0 };

const POLICE_STUDYLIB = '"Inter", "Segoe UI", system-ui, sans-serif';
const texteStudylib = { fontFamily: POLICE_STUDYLIB, fontWeight: 600, textTransform: 'none', letterSpacing: 0 };

const statut = (cle, sol) => ds.status[cle][sol];

const planner = (nuit) => {
    const s = nuit ? ds.surface.nuit : ds.surface.clair;
    return {
        ground: s.sol,
        surface: s.carte,
        line: s.filet,
        strong: s.filetAppuye,
        head: s.doux,
        text: s.encre,
        dim: nuit ? s.encreEffacee : s.encreSeconde,
        primary: s.primaire,
        primaryDark: ds.brand.navyDeep,
        primaryLight: '#3350A8',
        primaryHover: s.primaireSurvol,
        contrastText: nuit ? s.sol : '#FFFFFF',
        hover: nuit ? 'rgba(241, 245, 249, 0.06)' : s.doux,
        selected: s.primaireVoile,
        success: statut('confirme', nuit ? 'board' : 'bureau'),
        warning: statut('reporte', nuit ? 'board' : 'bureau'),
        error: statut('annule', nuit ? 'board' : 'bureau'),
        info: s.primaire,
        tooltip: nuit ? { fond: s.filet, texte: s.encre } : { fond: s.encre, texte: '#FFFFFF' },
        ombreCarte: nuit ? 'none' : ds.shadow.card,
        fontTitres: ds.font.board,
        fontCorps: ds.font.body,
        rayon: ds.radius,
        libelle: libellePlanner,
        bouton: boutonPlanner,
    };
};

const STUDYLIB_COULEURS = {
    clair: { ground: '#F8FAFC', surface: '#FFFFFF', line: '#E2E8F0', strong: '#CBD5E1', text: '#0F172A', dim: '#64748B', primary: '#1D4ED8', primaryDark: '#1E3A8A', head: '#F1F5F9', hover: '#EFF6FF', selected: '#DBEAFE' },
    nuit: { ground: '#0F172A', surface: '#1E293B', line: '#334155', strong: '#475569', text: '#F1F5F9', dim: '#94A3B8', primary: '#60A5FA', primaryDark: '#93C5FD', head: '#0F172A', hover: 'rgba(241, 245, 249, 0.06)', selected: 'rgba(96, 165, 250, 0.16)' },
};

const studylib = (nuit) => {
    const c = STUDYLIB_COULEURS[nuit ? 'nuit' : 'clair'];
    return {
        ...c,
        primaryLight: '#3B82F6',
        primaryHover: c.primaryDark,
        contrastText: nuit ? '#0F172A' : '#FFFFFF',
        success: statut('confirme', nuit ? 'board' : 'bureau'),
        warning: statut('reporte', nuit ? 'board' : 'bureau'),
        error: statut('annule', nuit ? 'board' : 'bureau'),
        info: nuit ? '#8FA6F0' : ds.brand.navy,
        tooltip: nuit ? { fond: '#334155', texte: '#F1F5F9' } : { fond: '#0F172A', texte: '#FFFFFF' },
        ombreCarte: 'none',
        fontTitres: POLICE_STUDYLIB,
        fontCorps: POLICE_STUDYLIB,
        rayon: { xs: 6, sm: 10, md: 14, lg: 18 },
        libelle: texteStudylib,
        bouton: texteStudylib,
    };
};

/** Palette MUI d'une famille dans un mode ('light' ou 'dark') : sols, textes, primaire, polices, rayons. */
export const paletteDe = (famille, mode) => (famille === 'studylib' ? studylib : planner)(mode !== 'light');

// Ancien panneau des départs (ds.board) en cartes claires, le temps que le lot V-2 le remplace :
// plus de noir, une carte blanche bordée d'un filet, les états en valeur « bureau » sur le clair.
const panneauPlanner = (nuit) => {
    const s = nuit ? ds.surface.nuit : ds.surface.clair;
    const sol = nuit ? 'board' : 'bureau';
    return {
        titre: s.encre,
        ground: s.carte,
        frame: s.filet,
        cell: s.doux,
        cellHinge: s.filet,
        seam: s.filet,
        letter: s.encre,
        letterDim: s.encreEffacee,
        onTime: s.encre,
        live: statut('confirme', sol),
        delayed: statut('reporte', sol),
        cancelled: statut('annule', sol),
    };
};

// StudyLib : panneau et menu sans marine, aux gris ardoise et au bleu de la bibliothèque
const PANNEAU_STUDYLIB = {
    clair: {
        board: { titre: '#0F172A', ground: '#FFFFFF', frame: '#E2E8F0', cell: '#F1F5F9', cellHinge: '#CBD5E1', seam: '#E2E8F0', letter: '#0F172A', letterDim: '#64748B', onTime: '#0F172A', live: '#15803D', delayed: '#B45309', cancelled: '#DC2626' },
        nav: { fond: '#FFFFFF', letter: '#0F172A', letterSoft: '#334155', letterDim: '#64748B', icon: '#64748B', selection: '#DBEAFE', survol: '#F1F5F9', filet: '#E2E8F0', bordBouton: '#CBD5E1', boutonActif: '#DBEAFE' },
    },
    nuit: {
        board: { titre: '#F1F5F9', ground: '#1E293B', frame: '#334155', cell: '#0F172A', cellHinge: '#162032', seam: '#334155', letter: '#F1F5F9', letterDim: '#94A3B8', onTime: '#F1F5F9', live: '#4ADE80', delayed: '#FB923C', cancelled: '#F87171' },
        nav: { fond: '#0F172A', letter: '#F1F5F9', letterSoft: '#CBD5E1', letterDim: '#94A3B8', icon: '#94A3B8', selection: 'rgba(96, 165, 250, 0.16)', survol: 'rgba(241, 245, 249, 0.06)', filet: '#1E293B', bordBouton: '#334155', boutonActif: 'rgba(96, 165, 250, 0.16)' },
    },
};

const enVariables = (prefixe, valeurs) => Object.fromEntries(Object.entries(valeurs).map(([cle, valeur]) => [`--${prefixe}-${cle}`, valeur]));

/** Variables CSS `--board-*` et `--nav-*` d'une famille dans un mode ; Planner garde son menu marine. */
export const variablesCss = (famille, mode) => {
    const nuit = mode !== 'light';
    if (famille === 'studylib') {
        const { board, nav } = PANNEAU_STUDYLIB[nuit ? 'nuit' : 'clair'];
        return { ...enVariables('board', board), ...enVariables('nav', nav) };
    }
    return enVariables('board', panneauPlanner(nuit));
};
