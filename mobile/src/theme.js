import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokens, lineColor } from '../../shared/tokens.js';

/**
 * Thèmes de l'application : deux familles, chacune en clair et en sombre (DESIGN.md).
 *  - planner  : les cartes claires de HESTIM (Barlow en casse normale, marine HESTIM réservé à la
 *               barre de titre, couleurs de statut seulement pour les statuts) ; nuit en ardoise.
 *  - studylib : la bibliothèque StudyLib (Inter, bleu #1d4ed8, gris ardoise, coins arrondis).
 * Le choix (famille + mode clair / sombre / automatique) est retenu sur l'appareil ; sans choix,
 * l'application s'ouvre en clair, quel que soit le réglage du téléphone.
 */

const clair = tokens.surface.clair;
const nuit = tokens.surface.nuit;

const policesPlanner = {
  panneau: 'BarlowCondensed_600SemiBold',
  panneauGras: 'BarlowCondensed_700Bold',
  panneauMoyen: 'BarlowCondensed_500Medium',
  texte: 'Barlow_400Regular',
  texteGras: 'Barlow_600SemiBold',
};

const policesStudylib = {
  panneau: 'Inter_600SemiBold',
  panneauGras: 'Inter_700Bold',
  panneauMoyen: 'Inter_500Medium',
  texte: 'Inter_400Regular',
  texteGras: 'Inter_600SemiBold',
};

// Valeur « board » des états : éclaircie, lisible sur l'ardoise de nuit
const statutsPanneau = Object.fromEntries(Object.entries(tokens.status).map(([cle, s]) => [cle, s.board]));
const statutsBureau = Object.fromEntries(Object.entries(tokens.status).map(([cle, s]) => [cle, s.bureau]));

const planner = {
  famille: 'planner',
  polices: policesPlanner,
  // Casse normale (DESIGN.md, Sentence Case Rule) ; la condensée reste aux titres et aux chiffres
  capitales: 'none',
  espacement: 0,
  rayons: { xs: 6, sm: tokens.rayon.petit, md: tokens.rayon.moyen, lg: tokens.rayon.grand },
};

const studylib = {
  famille: 'studylib',
  polices: policesStudylib,
  // StudyLib écrit en casse normale, sans lettres espacées
  capitales: 'none',
  espacement: 0,
  rayons: { xs: 6, sm: 10, md: 14, lg: 18 },
};

export const THEMES = {
  'planner-sombre': {
    ...planner,
    id: 'planner-sombre',
    // Texte de la barre d'état, lisible sur la barre de titre
    barreStatut: 'light',
    sombre: true,
    couleurs: {
      fond: nuit.sol,
      cellule: nuit.carte,
      filet: nuit.filet,
      lettre: nuit.encre,
      lettreAttenuee: nuit.encreEffacee,
      cadre: tokens.brand.navy,
      surCadre: '#FFFFFF',
      bordCadre: tokens.brand.navy,
      accent: nuit.primaire,
      surAccent: nuit.sol,
      enCours: tokens.status.confirme.board,
      reporte: tokens.status.reporte.board,
      annule: tokens.status.annule.board,
    },
    statuts: statutsPanneau,
    // Verre dépoli (barre d'onglets, feuilles) : teinte du flou, couleur du voile, liseré
    verre: { teinte: 'dark', rgb: '15, 23, 42', bord: 'rgba(255, 255, 255, 0.08)' },
    // Scène des jeux : décor Kenney (silhouettes teintées) derrière le personnage du joueur
    scene: { ciel: tokens.brand.navy, collines: tokens.brand.navyDeep, nuages: '#24397F', arbres: tokens.brand.navyDeep, texte: '#FFFFFF', texteAttenue: '#C9D1EC' },
  },
  'planner-clair': {
    ...planner,
    id: 'planner-clair',
    // Texte de la barre d'état, lisible sur la barre de titre
    barreStatut: 'light',
    sombre: false,
    couleurs: {
      fond: clair.sol,
      cellule: clair.carte,
      filet: clair.filet,
      lettre: clair.encre,
      lettreAttenuee: clair.encreEffacee,
      cadre: tokens.brand.navy,
      surCadre: '#FFFFFF',
      bordCadre: tokens.brand.navy,
      accent: tokens.brand.navy,
      surAccent: '#FFFFFF',
      enCours: tokens.brand.green,
      reporte: tokens.status.reporte.bureau,
      annule: tokens.status.annule.bureau,
    },
    statuts: statutsBureau,
    // Verre dépoli (barre d'onglets, feuilles) : teinte du flou, couleur du voile, liseré
    verre: { teinte: 'light', rgb: '245, 247, 251', bord: 'rgba(13, 19, 38, 0.10)' },
    // Scène des jeux : décor Kenney (silhouettes teintées) derrière le personnage du joueur
    scene: { ciel: tokens.brand.navy, collines: tokens.brand.navyDeep, nuages: '#24397F', arbres: tokens.brand.navyDeep, texte: '#FFFFFF', texteAttenue: '#C9D1EC' },
  },
  'studylib-clair': {
    ...studylib,
    id: 'studylib-clair',
    // Texte de la barre d'état, lisible sur la barre de titre
    barreStatut: 'dark',
    sombre: false,
    couleurs: {
      fond: '#F8FAFC',
      cellule: '#FFFFFF',
      filet: '#E2E8F0',
      lettre: '#0F172A',
      lettreAttenuee: '#64748B',
      cadre: '#FFFFFF',
      surCadre: '#0F172A',
      bordCadre: '#E2E8F0',
      accent: '#1D4ED8',
      surAccent: '#FFFFFF',
      enCours: '#15803D',
      reporte: '#B45309',
      annule: '#DC2626',
    },
    statuts: { planifie: '#334155', confirme: '#15803D', reporte: '#B45309', annule: '#DC2626', realise: '#64748B' },
    // Scène des jeux : décor Kenney (silhouettes teintées) derrière le personnage du joueur
    // Verre dépoli (barre d'onglets, feuilles) : teinte du flou, couleur du voile, liseré
    verre: { teinte: 'light', rgb: '255, 255, 255', bord: 'rgba(15, 23, 42, 0.08)' },
    scene: { ciel: '#EFF6FF', collines: '#DBEAFE', nuages: '#FFFFFF', arbres: '#BFDBFE', texte: '#0F172A', texteAttenue: '#334155' },
  },
  'studylib-sombre': {
    ...studylib,
    id: 'studylib-sombre',
    // Texte de la barre d'état, lisible sur la barre de titre
    barreStatut: 'light',
    sombre: true,
    couleurs: {
      fond: '#0F172A',
      cellule: '#1E293B',
      filet: '#334155',
      lettre: '#F1F5F9',
      lettreAttenuee: '#94A3B8',
      cadre: '#0F172A',
      surCadre: '#F1F5F9',
      bordCadre: '#1E293B',
      accent: '#2563EB',
      surAccent: '#FFFFFF',
      enCours: '#4ADE80',
      reporte: '#FB923C',
      annule: '#F87171',
    },
    statuts: { planifie: '#E2E8F0', confirme: '#4ADE80', reporte: '#FB923C', annule: '#F87171', realise: '#94A3B8' },
    // Scène des jeux : décor Kenney (silhouettes teintées) derrière le personnage du joueur
    // Verre dépoli (barre d'onglets, feuilles) : teinte du flou, couleur du voile, liseré
    verre: { teinte: 'dark', rgb: '15, 23, 42', bord: 'rgba(255, 255, 255, 0.08)' },
    scene: { ciel: '#1E293B', collines: '#0F172A', nuages: '#334155', arbres: '#0F172A', texte: '#F1F5F9', texteAttenue: '#CBD5E1' },
  },
};

export const FAMILLES = ['planner', 'studylib'];
export const MODES = ['automatique', 'clair', 'sombre'];
// Clair par défaut (DESIGN.md, The Light By Default Rule) ; « automatique » reste un choix
const PREFERENCE_DEFAUT = { famille: 'planner', mode: 'clair' };
const CLE_THEME = 'hestim.theme';

/** Thème à appliquer pour une préférence et l'apparence du téléphone (inconnue : clair) */
export const themePour = ({ famille, mode }, schemaSysteme) => {
  const sombre = mode === 'automatique' ? schemaSysteme === 'dark' : mode === 'sombre';
  return THEMES[`${FAMILLES.includes(famille) ? famille : 'planner'}-${sombre ? 'sombre' : 'clair'}`];
};

const valide = (p) => p && FAMILLES.includes(p.famille) && MODES.includes(p.mode);

const ThemeContext = createContext({ theme: THEMES['planner-clair'], preference: PREFERENCE_DEFAUT, changer: () => {} });

/** Reprend le thème choisi sur cet appareil avant d'afficher l'application */
export const restaurerTheme = async () => {
  try {
    const lu = JSON.parse((await AsyncStorage.getItem(CLE_THEME)) || 'null');
    return valide(lu) ? lu : PREFERENCE_DEFAUT;
  } catch {
    return PREFERENCE_DEFAUT;
  }
};

export function ThemeProvider({ preferenceInitiale = PREFERENCE_DEFAUT, children }) {
  const schema = useColorScheme();
  const [preference, setPreference] = useState(preferenceInitiale);

  const changer = useCallback((modif) => {
    setPreference((avant) => {
      const suivante = { ...avant, ...modif };
      if (!valide(suivante)) return avant;
      AsyncStorage.setItem(CLE_THEME, JSON.stringify(suivante)).catch(() => {});
      return suivante;
    });
  }, []);

  const valeur = useMemo(() => ({ theme: themePour(preference, schema), preference, changer }), [preference, schema, changer]);
  return createElement(ThemeContext.Provider, { value: valeur }, children);
}

/** Thème courant : { couleurs, polices, capitales, espacement, rayons, statuts, verre, scene, sombre, barreStatut } */
export const useTheme = () => useContext(ThemeContext).theme;

/** Préférence de thème et de quoi la changer (écran Compte) */
export const usePreferenceTheme = () => {
  const { preference, changer } = useContext(ThemeContext);
  return { preference, changer };
};

/**
 * Feuille de styles qui suit le thème : `const useStyles = creerStyles((t) => ({ … }))`, puis
 * `const styles = useStyles()` dans le composant. Une feuille par thème, créée une seule fois.
 */
export const creerStyles = (fabrique) => {
  const parTheme = new Map();
  return () => {
    const theme = useTheme();
    if (!parTheme.has(theme.id)) parTheme.set(theme.id, StyleSheet.create(fabrique(theme)));
    return parTheme.get(theme.id);
  };
};

/** Espacement des lettres du thème (aucun : casse normale dans les deux familles) */
export const espace = (theme, valeur) => valeur * theme.espacement;

/** Couleur d'un statut de séance dans le thème courant */
export const couleurStatut = (theme, statut) => theme.statuts[statut] ?? theme.couleurs.lettre;

export { lineColor };

/** Zone tactile minimale (accessibilité) */
export const CIBLE_TACTILE = 48;
