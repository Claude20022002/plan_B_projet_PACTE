/**
 * AppProviders.jsx
 * Arbre de providers unique — ordre intentionnel :
 *   Theme → Auth → QueryClient → Toast → children
 *
 * Chaque provider a une responsabilité unique.
 * Ajouter un provider ici sans toucher main.jsx ni App.jsx.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import CssBaseline from '@mui/material/CssBaseline';

// DevTools chargé uniquement en dev, jamais dans le bundle prod
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : null;

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
            {import.meta.env.DEV && ReactQueryDevtools && (
              <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
              </Suspense>
            )}
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
