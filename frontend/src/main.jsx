import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Barlow : famille de signalétique, auto-hébergée (pas de dépendance à un CDN de polices)
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
// Inter : police du thème StudyLib (choisi dans le pied du menu)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css';
import i18n from './i18n';
import App from './App.jsx';
import AppProviders from './providers/AppProviders.jsx';
import { chargerIdentite } from './services/etablissement';
import { appliquerMarque } from './design-system/marque';

// L'école d'abord (nom, couleurs) : le premier affichage est déjà le bon, sans changement de couleurs
const identite = await chargerIdentite();
appliquerMarque(identite);
// {{ecole}}, {{nomEcole}} et {{produit}} dans tous les textes traduits
i18n.options.interpolation.defaultVariables = { ecole: identite.nom_court, nomEcole: identite.nom, produit: identite.produit };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
