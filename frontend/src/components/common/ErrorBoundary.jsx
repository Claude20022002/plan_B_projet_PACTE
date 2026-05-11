/**
 * ErrorBoundary.jsx — Capture les erreurs React non gérées.
 *
 * Utilisations :
 *   1. Global dans App.jsx (wrap toutes les routes)
 *   2. Autour des composants à risque (FullCalendar, charts)
 *
 * En production, reporter l'erreur à Sentry ici.
 */

import { Component } from 'react';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // En production : Sentry.captureException(error, { extra: errorInfo });
    if (import.meta.env.DEV) {
      console.group('%c[ErrorBoundary] Erreur capturée', 'color: red; font-weight: bold');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;
    const { fallback } = this.props;

    // Fallback personnalisé (ex: ErrorBoundary autour d'un widget)
    if (fallback) return fallback({ error: this.state.error, reset: this.handleReset });

    return (
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: this.props.fullPage !== false ? '100vh' : '200px',
          p: 3,
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 480, borderRadius: 3 }}>
          <ErrorOutline sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Quelque chose s'est mal passé
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={3}>
            Une erreur inattendue s'est produite. Elle a été signalée automatiquement.
          </Typography>

          {isDev && this.state.error && (
            <Box sx={{
              mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1,
              textAlign: 'left', maxHeight: 120, overflow: 'auto',
            }}>
              <Chip label="DEV" size="small" color="error" sx={{ mb: 1 }} />
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11 }}>
                {this.state.error.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={this.handleReset}
              startIcon={<Refresh />}
            >
              Réessayer
            </Button>
            <Button
              variant="contained"
              onClick={() => { window.location.href = '/'; }}
            >
              Accueil
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}
