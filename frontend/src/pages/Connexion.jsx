import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Link, TextField, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ds } from '../design-system/tokens';
import { cheminSuivantSur } from '../utils/redirection';
import EcranPublic, { TitreEcran } from '../components/auth/EcranPublic';
import ChampMotDePasse from '../components/auth/ChampMotDePasse';

const errorKeyFor = (message = '') => {
  if (/identifiants|invalid|incorrect/i.test(message)) return 'login.errorInvalid';
  if (/désactivé|disabled/i.test(message)) return 'login.errorDisabled';
  if (/trop de|too many/i.test(message)) return 'login.errorTooMany';
  return 'login.errorGeneric';
};

/**
 * Connexion : e-mail et mot de passe, puis le code de double authentification si le compte en a
 * une. La mise en page (panneau, logo, langue) est celle de tous les écrans publics (EcranPublic).
 */
export default function Connexion() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Retour vers la bibliothèque (StudyLib) si la connexion a été demandée par elle
  const suivant = cheminSuivantSur(params.get('next'));
  const { login, verifierMfa, loading: chargementSession, isAuthenticated } = useAuth();

  // Session encore valide (ou renouvelée au chargement) : retour direct à la bibliothèque
  useEffect(() => {
    if (suivant && !chargementSession && isAuthenticated) window.location.assign(suivant);
  }, [suivant, chargementSession, isAuthenticated]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState('');
  const [loading, setLoading] = useState(false);
  // Double authentification : défi reçu après le mot de passe, en attente du code
  const [defi, setDefi] = useState(null);
  const [code, setCode] = useState('');
  const [erreurCode, setErreurCode] = useState('');
  // Le bouton d'envoi est désactivé pendant la requête : le focus tombait sur <body> et un lecteur
  // d'écran n'annonçait pas l'erreur (M-13). Il va sur le message.
  const messageErreur = useRef(null);
  useEffect(() => {
    if (errorKey) messageErreur.current?.focus();
  }, [errorKey]);

  const allerApres = (data) => {
    // Le rôle vient du compte : aucune saisie de « fonction » n'est demandée
    const role = data?.user?.role;
    if (suivant) window.location.assign(suivant);
    else navigate(role ? `/dashboard/${role}` : '/');
  };

  const envoyerCode = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    setErreurCode('');
    setLoading(true);
    const result = await verifierMfa(defi, code.trim());
    setLoading(false);
    if (result.success) return allerApres(result.data);
    setCode('');
    // Défi expiré ou trop d'essais : retour au mot de passe
    if (/recommencez|start again/i.test(result.error ?? '')) {
      setDefi(null);
      setErrorKey('login.mfa.expire');
      return undefined;
    }
    setErreurCode(result.error || t('login.mfa.incorrect'));
    return undefined;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorKey('');
    // Lecture directe du formulaire : le remplissage automatique du navigateur
    // ne déclenche pas toujours onChange
    const form = new FormData(event.currentTarget);
    const emailValue = String(form.get('email') || email).trim();
    const passwordValue = String(form.get('password') || password);
    if (!emailValue || !passwordValue) {
      setErrorKey('login.errorMissing');
      return;
    }
    setLoading(true);
    try {
      const result = await login(emailValue, passwordValue);
      if (result.success) {
        allerApres(result.data);
      } else if (result.mfa) {
        setDefi(result.defi);
        setCode('');
        setErreurCode('');
      } else {
        setErrorKey(errorKeyFor(result.error));
      }
    } catch {
      setErrorKey('login.errorGeneric');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EcranPublic>
      {defi ? (
        <Box component="form" onSubmit={envoyerCode} noValidate sx={{ width: '100%', maxWidth: 400 }}>
          <TitreEcran titre={t('login.mfa.title')} sousTitre={t('login.mfa.aide')} />
          {erreurCode && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {erreurCode}
            </Alert>
          )}
          <TextField
            required
            fullWidth
            autoFocus
            label={t('login.mfa.code')}
            name="code"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setErreurCode('');
            }}
            disabled={loading}
            inputProps={{ maxLength: 12, style: { fontFamily: ds.font.board, fontSize: '1.5rem', letterSpacing: '0.2em' } }}
            helperText={t('login.mfa.secours')}
          />
          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading || !code.trim()} sx={{ mt: 3, minHeight: 48, fontSize: '1rem' }}>
            {loading ? <CircularProgress size={22} color="inherit" aria-label={t('login.submitting')} /> : t('login.mfa.valider')}
          </Button>
          <Button fullWidth onClick={() => setDefi(null)} disabled={loading} sx={{ mt: 1.5 }}>
            {t('login.mfa.retour')}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%', maxWidth: 400 }}>
          <TitreEcran titre={t('login.title')} sousTitre={t('login.subtitle')} />

          {errorKey && (
            <Alert ref={messageErreur} tabIndex={-1} severity="error" sx={{ mb: 2.5, outline: 'none' }}>
              {t(errorKey)}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              required
              fullWidth
              size="medium"
              label={t('login.email')}
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorKey('');
              }}
              disabled={loading}
            />
            <ChampMotDePasse
              required
              fullWidth
              size="medium"
              label={t('login.password')}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorKey('');
              }}
              disabled={loading}
            />
          </Box>

          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Link component={RouterLink} to="/mot-de-passe-oublie" sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
              {t('login.forgot')}
            </Link>
          </Box>

          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, minHeight: 48, fontSize: '1rem' }}>
            {loading ? <CircularProgress size={22} color="inherit" aria-label={t('login.submitting')} /> : t('login.submit')}
          </Button>

          <Typography sx={{ mt: 3, color: 'text.secondary', fontSize: '0.875rem' }}>{t('login.accountsByAdmin')}</Typography>
        </Box>
      )}
    </EcranPublic>
  );
}
