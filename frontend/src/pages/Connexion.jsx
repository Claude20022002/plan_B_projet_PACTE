import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { FlapText, FlapTiles } from '../design-system/board';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Panneau de présentation : une ligne qui bascule pour montrer ce que l'outil affiche */
function LiveBoard() {
  const { t } = useTranslation();
  const lines = t('login.boardLines', { returnObjects: true });
  const [index, setIndex] = useState(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % lines.length), 3200);
    return () => clearInterval(id);
  }, [reduced, lines.length]);

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
        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: `1px solid ${ds.board.seam}`,
            fontFamily: ds.font.board,
            fontWeight: 600,
            fontSize: { md: '1.375rem', lg: '1.625rem' },
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: ds.board.letter,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minHeight: '2.4em',
          }}
          aria-live="off"
        >
          <Box component="span" aria-hidden="true" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ds.board.live, flexShrink: 0 }} />
          {reduced ? (
            <Box component="span" sx={{ fontSize: '1rem', letterSpacing: '0.06em', lineHeight: 1.6 }}>
              {lines.join(' · ')}
            </Box>
          ) : (
            <FlapText value={lines[index]} />
          )}
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
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorKey, setErrorKey] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Le rôle vient du compte : aucune saisie de « fonction » n'est demandée
        const role = result.data?.user?.role;
        navigate(role ? `/dashboard/${role}` : '/');
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
          px: { md: 5, lg: 8 },
          py: 6,
        }}
      >
        <LiveBoard />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
        </Box>
      </Box>
    </Box>
  );
}
