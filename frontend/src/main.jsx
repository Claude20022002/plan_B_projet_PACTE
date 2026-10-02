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
import './index.css';
import './i18n';
import App from './App.jsx';
import AppProviders from './providers/AppProviders.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
