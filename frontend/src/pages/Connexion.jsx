import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LANGUAGES } from '../i18n';
import { ds } from '../design-system/tokens';
import { cheminSuivantSur } from '../utils/redirection';
import { FlapTiles } from '../design-system/board';

/**
 * Panneau de présentation : ce que l'outil affiche, en lignes fixes de panneau.
 * Pas de rotation automatique (la bascule signale un vrai changement, jamais une décoration).
 */
function LiveBoard() {
  const { t } = useTranslation();
  const lines = t('login.boardLines', { returnObjects: true });

  return (
    <Box sx={{ bgcolor: ds.board.frame, p: '10px', borderRadius: `${ds.radius.lg}px`, width: '100%', maxWidth: 560 }}>
      <Box sx={{ px: 1, pb: 1.25, display: 'flex', justifyContent: 'space-between', color: '#FFFFFF', fontFamily: ds.font.board, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        <span>{t('login.boardTitle')}</span>
        <span>HESTIM</span>
      </Box>
      <Box sx={{ bgcolor: ds.board.ground, borderRadius: `${ds.radius.md}px`, px: { md: 3, lg: 4 }, py: 4 }}>
        <FlapTiles value="HESTIM" size="clamp(2.25rem, 4.4vw, 3.75rem)" />
        <Box sx={{ mt: 1.25 }}>
          <FlapTiles value="PLANNER" size="clamp(2.25rem, 4.4vw, 3.75rem)" color={ds.brand.orange} />
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 4, p: 0, borderTop: `1px solid ${ds.board.seam}` }}>
          {lines.map((line, i) => (
            <Box
              component="li"
              key={line}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1.25,
                borderBottom: `1px solid ${ds.board.seam}`,
                fontFamily: ds.font.board,
                fontWeight: 600,
                fontSize: { md: '1.125rem', lg: '1.25rem' },
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: ds.board.letter,
              }}
            >
              <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: i === 0 ? ds.board.live : ds.board.letterDim }} />
              {line}
            </Box>
          ))}
        </Box>
        <Typography sx={{ mt: 3, color: ds.board.letterDim, fontSize: '0.9375rem' }}>
          {t('app.school')}
        </Typography>
      </Box>
    </Box>
  );
}

const errorKeyFor = (message = '') => {
  if (/identifiants|invalid|incorrect/i.test(message)) return 'login.errorInvalid';
  if (/désactivé|disabled/i.test(message)) return 'login.errorDisabled';
  if (/trop de|too many/i.test(message)) return 'login.errorTooMany';
  return 'login.errorGeneric';
};

export default function Connexion() {
  const { t, i18n } = useTranslation();
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
  const [showPassword, setShowPassword] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const [loading, setLoading] = useState(false);
  // Double authentification : défi reçu après le mot de passe, en attente du code
  const [defi, setDefi] = useState(null);
  const [code, setCode] = useState('');
  const [erreurCode, setErreurCode] = useState('');

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
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, bgcolor: 'background.paper' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: ds.board.ground,
          // Une vraie salle de HESTIM derrière le panneau : voile léger au centre (la salle se voit),
          // plus dense vers les bords ; le panneau garde son propre fond noir, donc son contraste
          backgroundImage:
            'radial-gradient(ellipse at 50% 55%, rgba(11, 11, 13, 0.35) 0%, rgba(11, 11, 13, 0.55) 55%, rgba(11, 11, 13, 0.85) 100%), url(/img/hestim/seance-salle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: '50% 60%',
          px: { md: 5, lg: 8 },
          py: 6,
        }}
      >
        <LiveBoard />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Téléphone : le panneau en bandeau, première chose que voit un étudiant */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, bgcolor: ds.board.frame, p: '6px' }}>
          <Box sx={{ bgcolor: ds.board.ground, borderRadius: `${ds.radius.md}px`, px: 2, py: 1.75, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <FlapTiles value="HESTIM" size="1.5rem" />
            <FlapTiles value="PLANNER" size="1.5rem" color={ds.brand.orange} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 4 }, pt: { xs: 2, sm: 3 } }}>
          <Box component="img" src="/HESTIM.png" alt="HESTIM Engineering & Business School" sx={{ height: { xs: 32, sm: 38 } }} />
          <ToggleButtonGroup
            size="small"
            exclusive
            value={i18n.language}
            onChange={(_, value) => value && i18n.changeLanguage(value)}
            aria-label={t('common.language')}
            sx={{ '& .MuiToggleButton-root': { fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.08em', px: 1.25, py: 0.25 } }}
          >
            {LANGUAGES.map((lang) => (
              <ToggleButton key={lang.code} value={lang.code} aria-label={lang.label}>
                {lang.short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 2, sm: 4 }, py: { xs: 4, sm: 6 } }}>
          {defi ? (
            <Box component="form" onSubmit={envoyerCode} noValidate sx={{ width: '100%', maxWidth: 400 }}>
              <Typography component="h1" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: { xs: '2rem', sm: '2.25rem' }, lineHeight: 1.1 }}>
                {t('login.mfa.title')}
              </Typography>
              <Typography sx={{ mt: 1, mb: 3.5, color: 'text.secondary', fontSize: '1rem' }}>{t('login.mfa.aide')}</Typography>
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
            <Typography component="h1" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: { xs: '2rem', sm: '2.25rem' }, lineHeight: 1.1 }}>
              {t('login.title')}
            </Typography>
            <Typography sx={{ mt: 1, mb: 3.5, color: 'text.secondary', fontSize: '1rem' }}>{t('login.subtitle')}</Typography>

            {errorKey && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
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
              <TextField
                required
                fullWidth
                size="medium"
                label={t('login.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorKey('');
                }}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Link component={RouterLink} to="/forgot-password" sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                {t('login.forgot')}
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, minHeight: 48, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={22} color="inherit" aria-label={t('login.submitting')} /> : t('login.submit')}
            </Button>

            <Typography sx={{ mt: 3, color: 'text.secondary', fontSize: '0.875rem' }}>{t('login.accountsByAdmin')}</Typography>
          </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
