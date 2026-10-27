/**
 * Internationalisation FR / EN.
 * Le français est la langue par défaut (langue d'enseignement des écoles visées) ;
 * le choix de l'utilisateur est mémorisé et appliqué à <html lang>.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.js';
import en from './en.js';
import studioFr from './studio.fr.js';
import studioEn from './studio.en.js';
import sessionsJeuFr from './sessionsJeu.fr.js';
import sessionsJeuEn from './sessionsJeu.en.js';
import directFr from './direct.fr.js';
import directEn from './direct.en.js';
import etablissementFr from './etablissement.fr.js';
import etablissementEn from './etablissement.en.js';

export const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
];

const STORAGE_KEY = 'hp.lang';

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    // Stockage indisponible (navigation privée) : on garde la langue par défaut
  }
  return 'fr';
};

i18n.use(initReactI18next).init({
  // Studio quiz, sessions de jeu, identité de l'école : textes dans leurs propres fichiers, sous leur clé
  resources: {
    fr: { translation: { ...fr, studio: studioFr, sessionsJeu: sessionsJeuFr, direct: directFr, etablissement: etablissementFr } },
    en: { translation: { ...en, studio: studioEn, sessionsJeu: sessionsJeuEn, direct: directEn, etablissement: etablissementEn } },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

const applyHtmlLang = (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
applyHtmlLang(i18n.language);

i18n.on('languageChanged', (lng) => {
  applyHtmlLang(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Préférence non mémorisée : sans conséquence
  }
});

export default i18n;
