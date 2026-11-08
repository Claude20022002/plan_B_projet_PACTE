import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Link, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import EcranPublic, { TitreEcran } from '../components/auth/EcranPublic';

/** Mot de passe oublié : demande du lien de réinitialisation par e-mail, au style de la connexion. */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('forgot.erreur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <EcranPublic>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
        <TitreEcran titre={t('forgot.titre')} sousTitre={success ? null : t('forgot.intro')} />

        {success ? (
          // Même réponse que l'adresse soit connue ou non : on ne révèle pas les comptes
          <Alert severity="success" sx={{ mt: 3 }}>
            {t('forgot.envoye')}
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {error}
              </Alert>
            )}
            <TextField fullWidth required autoFocus label={t('login.email')} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, minHeight: 48, fontSize: '1rem' }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : t('forgot.envoyer')}
            </Button>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/connexion" sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
            {t('forgot.retourConnexion')}
          </Link>
        </Box>
      </Box>
    </EcranPublic>
  );
}
