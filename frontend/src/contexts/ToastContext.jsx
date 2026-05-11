/**
 * ToastContext.jsx
 * Provider de notifications globales (succès, erreur, info, avertissement).
 * Remplace les Snackbar locaux dans les pages.
 *
 * Usage :
 *   const toast = useToast();
 *   toast.success('Salle créée avec succès');
 *   toast.error('Erreur lors de la suppression');
 *   toast.info('Aucune donnée disponible');
 */

import { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [open, setOpen]   = useState(false);
  const [current, setCurrent] = useState(null);

  const show = useCallback((message, severity = 'info', duration = 4000) => {
    const entry = { message, severity, duration, key: Date.now() };
    setQueue(q => [...q, entry]);
    setCurrent(entry);
    setOpen(true);
  }, []);

  const handleClose = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  const handleExited = useCallback(() => {
    setQueue(q => {
      const next = q.slice(1);
      if (next.length > 0) {
        setCurrent(next[0]);
        setOpen(true);
      }
      return next;
    });
  }, []);

  const toast = {
    success: (msg, opts) => show(msg, 'success', opts?.duration),
    error:   (msg, opts) => show(msg, 'error',   opts?.duration ?? 6000),
    warning: (msg, opts) => show(msg, 'warning', opts?.duration),
    info:    (msg, opts) => show(msg, 'info',    opts?.duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={current?.duration ?? 4000}
        onClose={handleClose}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={current?.severity ?? 'info'}
          variant="filled"
          sx={{ width: '100%', minWidth: 280 }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
