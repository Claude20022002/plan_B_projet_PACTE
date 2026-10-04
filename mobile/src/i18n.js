import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import partageFr from '../../shared/i18n/fr.js';
import partageEn from '../../shared/i18n/en.js';

/**
 * Traductions : espaces communs avec le web (status, board : shared/i18n) et espace « app »
 * propre au mobile. Langue choisie dans Compte, retenue sur l'appareil.
 */
const fr = {
  ...partageFr,
  app: {
    nom: 'HESTIM Planner',
    onglets: { tableau: 'Tableau', semaine: 'Semaine', bibliotheque: 'Bibliothèque', compte: 'Compte' },
    connexion: {
      titre: 'Connexion',
      email: 'Email HESTIM',
      motDePasse: 'Mot de passe',
      afficher: 'Afficher le mot de passe',
      masquer: 'Masquer le mot de passe',
      valider: 'Se connecter',
      erreurIdentifiants: 'Email ou mot de passe incorrect.',
      erreurReseau: 'Serveur injoignable. Vérifiez votre connexion.',
      erreurRole: 'Cette application est réservée aux étudiants. Utilisez le site web.',
      erreurConfiguration: 'Application mal configurée (adresse non sécurisée).',
      erreurMotDePasse: 'Changez votre mot de passe provisoire sur le site web, puis revenez.',
      erreurTrop: 'Trop de tentatives. Patientez quelques minutes.',
      aide: 'Compte créé par l’administration de l’école. Mot de passe oublié : passez par le site web.',
    },
    tableau: {
      alertes: 'Alertes',
      aujourdhui: 'Aujourd’hui',
      horsLigne: 'Hors ligne · mis à jour à {{heure}}',
      misAJour: 'Mis à jour à {{heure}}',
      rien: 'Rien de prévu aujourd’hui.',
      erreur: 'Impossible de charger l’emploi du temps.',
      reessayer: 'Réessayer',
      supports: 'Supports du cours',
    },
    semaine: { precedente: 'Semaine précédente', suivante: 'Semaine suivante', vide: 'Aucune séance cette semaine.', cetteSemaine: 'Cette semaine' },
    bibliotheque: {
      mesModules: 'Mes modules',
      documents_one: '{{count}} document',
      documents_other: '{{count}} documents',
      aucunModule: 'Vos modules apparaîtront avec votre emploi du temps.',
      stages: 'Avis de stage',
      partagerStage: 'Partager mon stage',
      projets: 'Idées de projets',
      indisponible: 'Bibliothèque indisponible pour le moment.',
      telecharger: 'Ouvrir',
      aucunDocument: 'Aucun document publié pour ce module.',
    },
    stage: {
      titre: 'Partager mon stage',
      entreprise: 'Entreprise',
      ville: 'Ville',
      poste: 'Poste',
      avis: 'Votre retour (missions, encadrement, conseils)',
      note: 'Note',
      remunere: 'Stage rémunéré',
      consentement: 'J’accepte que ce retour soit publié dans la bibliothèque, visible des étudiants HESTIM.',
      envoyer: 'Publier',
      merci: 'Merci ! Votre retour est publié.',
      erreur: 'Envoi impossible. Vérifiez les champs.',
    },
    compte: {
      profil: 'Profil',
      langue: 'Langue',
      notifications: 'Notifications',
      notificationsAide: 'Reports, annulations et changements de salle.',
      deconnexion: 'Se déconnecter',
      groupe: 'Groupe',
      version: 'Version {{version}}',
    },
    alertes: { titre: 'Alertes', vide: 'Aucune alerte.' },
    commun: { fermer: 'Fermer', retour: 'Retour', chargement: 'Chargement…' },
    distanciel: 'Distanciel',
    aDistance: 'à distance',
  },
};

const en = {
  ...partageEn,
  app: {
    nom: 'HESTIM Planner',
    onglets: { tableau: 'Board', semaine: 'Week', bibliotheque: 'Library', compte: 'Account' },
    connexion: {
      titre: 'Sign in',
      email: 'HESTIM email',
      motDePasse: 'Password',
      afficher: 'Show password',
      masquer: 'Hide password',
      valider: 'Sign in',
      erreurIdentifiants: 'Wrong email or password.',
      erreurReseau: 'Server unreachable. Check your connection.',
      erreurRole: 'This app is for students. Please use the website.',
      erreurConfiguration: 'App misconfigured (insecure address).',
      erreurMotDePasse: 'Change your temporary password on the website, then come back.',
      erreurTrop: 'Too many attempts. Please wait a few minutes.',
      aide: 'Accounts are created by the school. Forgot your password? Use the website.',
    },
    tableau: {
      alertes: 'Alerts',
      aujourdhui: 'Today',
      horsLigne: 'Offline · updated at {{heure}}',
      misAJour: 'Updated at {{heure}}',
      rien: 'Nothing scheduled today.',
      erreur: 'Could not load the timetable.',
      reessayer: 'Try again',
      supports: 'Course materials',
    },
    semaine: { precedente: 'Previous week', suivante: 'Next week', vide: 'No sessions this week.', cetteSemaine: 'This week' },
    bibliotheque: {
      mesModules: 'My courses',
      documents_one: '{{count}} document',
      documents_other: '{{count}} documents',
      aucunModule: 'Your courses will appear with your timetable.',
      stages: 'Internship reviews',
      partagerStage: 'Share my internship',
      projets: 'Project ideas',
      indisponible: 'Library unavailable for now.',
      telecharger: 'Open',
      aucunDocument: 'No document published for this course.',
    },
    stage: {
      titre: 'Share my internship',
      entreprise: 'Company',
      ville: 'City',
      poste: 'Position',
      avis: 'Your feedback (tasks, supervision, advice)',
      note: 'Rating',
      remunere: 'Paid internship',
      consentement: 'I agree that this review is published in the library, visible to HESTIM students.',
      envoyer: 'Publish',
      merci: 'Thank you! Your review is published.',
      erreur: 'Could not send. Check the fields.',
    },
    compte: {
      profil: 'Profile',
      langue: 'Language',
      notifications: 'Notifications',
      notificationsAide: 'Postponements, cancellations and room changes.',
      deconnexion: 'Sign out',
      groupe: 'Group',
      version: 'Version {{version}}',
    },
    alertes: { titre: 'Alerts', vide: 'No alerts.' },
    commun: { fermer: 'Close', retour: 'Back', chargement: 'Loading…' },
    distanciel: 'Remote',
    aDistance: 'remote',
  },
};

const CLE_LANGUE = 'hestim.langue';

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

/** Reprend la langue choisie sur cet appareil */
export const restaurerLangue = async () => {
  try {
    const langue = await AsyncStorage.getItem(CLE_LANGUE);
    if (langue === 'fr' || langue === 'en') await i18n.changeLanguage(langue);
  } catch {
    // Stockage indisponible : on reste en français
  }
};

export const changerLangue = async (langue) => {
  await i18n.changeLanguage(langue);
  await AsyncStorage.setItem(CLE_LANGUE, langue).catch(() => {});
};

export default i18n;
