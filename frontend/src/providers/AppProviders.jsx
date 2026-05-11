/**
 * AppProviders.jsx
 * Arbre de providers unique — ordre intentionnel :
 *   Theme → Auth → QueryClient → Toast → children
 *
 * Chaque provider a une responsabilité unique.
 * Ajouter un provider ici sans toucher main.jsx ni App.jsx.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools }  from '@tanstack/react-query-devtools';
import CssBaseline from '@mui/material/CssBaseline';

import { ThemeProvider }  from '../contexts/ThemeContext';
import { AuthProvider }   from '../contexts/AuthContext';
import { ToastProvider }  from '../contexts/ToastContext';
import { queryClient }    from '../services/queryClient';
import { useGlobalQueryError } from '../hooks/api/_shared/useGlobalQueryError';

// ── Pont d'erreur React Query → Toast ─────────────────────────────────────
// Composant interne : doit être à l'intérieur de QueryClientProvider ET ToastProvider
function QueryErrorBridge() {
  useGlobalQueryError();
  return null;
}

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <QueryErrorBridge />
            {children}
            {/* DevTools visibles uniquement en développement */}
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            )}
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
