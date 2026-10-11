/**
 * AppProviders.jsx
 * Arbre de providers unique — ordre intentionnel :
 *   Theme → Auth → Toast → children
 *
 * Chaque provider a une responsabilité unique.
 * Ajouter un provider ici sans toucher main.jsx ni App.jsx.
 */

import CssBaseline from '@mui/material/CssBaseline';

import { ThemeProvider }  from '../contexts/ThemeContext';
import { AuthProvider }   from '../contexts/AuthContext';
import { ToastProvider }  from '../contexts/ToastContext';
import { ConfirmationProvider } from '../contexts/ConfirmationContext';

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <ToastProvider>
          {/* Fenêtre de confirmation commune (useConfirmation, à la place de window.confirm) */}
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
