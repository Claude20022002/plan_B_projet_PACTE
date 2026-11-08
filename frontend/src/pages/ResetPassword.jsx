import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import EcranPublic, { TitreEcran } from '../components/auth/EcranPublic';
import ChampMotDePasse from '../components/auth/ChampMotDePasse';

const LONGUEUR_MIN = 12;

/**
 * Réinitialisation du mot de passe, ou premier choix du mot de passe (lien d'invitation), au style
 * de la connexion. Le lien porte le jeton et l'identifiant du compte.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const idUser = searchParams.get('id');
  // Lien reçu à la création du compte : on « choisit » son mot de passe plutôt qu'on le réinitialise
  const invitation = searchParams.get('invitation') === '1';
  const lienValide = Boolean(token && idUser);

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(lienValide ? '' : t('reset.lienInvalide'));
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (motDePasse !== confirmation) return setError(t('password.mismatch'));
    if (motDePasse.length < LONGUEUR_MIN) return setError(t('reset.tropCourt'));
    setLoading(true);
    try {
      await authAPI.resetPassword(token, parseInt(idUser, 10), motDePasse);
      setSuccess(true);
      setTimeout(() => navigate('/connexion'), 3000);
    } catch (err) {
      setError(err.message || err.error || t('reset.erreur'));
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  return (
    <EcranPublic>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
        <TitreEcran titre={invitation ? t('password.title') : t('reset.titre')} sousTitre={lienValide && !success ? t('reset.intro') : null} />

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, mt: lienValide ? 0 : 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {t('reset.succes')}
          </Alert>
        )}

        {lienValide && !success && (
          <>
            <Box sx={{ display: 'grid', gap: 2.5 }}>
              <ChampMotDePasse
                fullWidth
                required
                autoFocus
                label={t('password.new')}
                name="password"
                autoComplete="new-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                helperText={t('reset.aide')}
              />
              <ChampMotDePasse
                fullWidth
                required
                label={t('reset.confirmer')}
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </Box>
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, minHeight: 48, fontSize: '1rem' }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : t('reset.envoyer')}
            </Button>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/connexion" sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
            {success ? t('reset.allerConnexion') : t('forgot.retourConnexion')}
          </Link>
        </Box>
      </Box>
    </EcranPublic>
  );
}
