import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LANGUAGES } from '../i18n';
import { ds } from '../design-system/tokens';
import { FlapTiles } from '../design-system/board';

/**
 * Photo réelle de l'école (hestim.ma) encadrée comme le panneau, légendée par une étiquette
 * de quai en capitales condensées.
 */
function PhotoWithCaption({ src, alt, caption, sx, objectPosition = '50% 50%', eager = false }) {
  return (
    <Box component="figure" sx={{ m: 0, position: 'relative', bgcolor: ds.board.frame, p: '6px', borderRadius: `${ds.radius.lg}px`, ...sx }}>
      <Box
        component="img"
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition, borderRadius: `${ds.radius.md}px` }}
      />
      <Box
        component="figcaption"
        sx={{
          position: 'absolute',
          left: 18,
          bottom: 18,
          px: 1.5,
          py: 0.75,
          bgcolor: ds.board.ground,
          color: ds.board.letter,
          borderRadius: '3px',
          fontFamily: ds.font.board,
          fontWeight: 600,
          fontSize: { xs: '0.875rem', md: '1rem' },
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {caption}
      </Box>
    </Box>
  );
}

/**
 * Accueil public : le panneau HESTIM Planner et ce qu'il affiche.
 * Les fonctionnalités sont des lignes du panneau ; aucune donnée ni statistique inventée.
 */
export default function Accueil() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const features = t('landing.features', { returnObjects: true });

  const enter = () => navigate(isAuthenticated && user?.role ? `/dashboard/${user.role}` : '/connexion');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: ds.board.ground, color: ds.board.letter, display: 'flex', flexDirection: 'column' }}>
      <Box
        component="header"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: { xs: 2, md: 6 }, py: 2, bgcolor: ds.board.frame }}
      >
        <Box sx={{ bgcolor: '#FFFFFF', borderRadius: `${ds.radius.md}px`, px: 1.25, py: 0.75, display: 'inline-flex' }}>
          <Box component="img" src="/HESTIM.png" alt="HESTIM Engineering & Business School" sx={{ height: { xs: 24, md: 28 }, display: 'block' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={i18n.language}
            onChange={(_, value) => value && i18n.changeLanguage(value)}
            aria-label={t('common.language')}
            sx={{
              '& .MuiToggleButton-root': {
                fontFamily: ds.font.board,
                fontWeight: 600,
                letterSpacing: '0.08em',
                px: 1.25,
                py: 0.25,
                color: '#B9C3E6',
                borderColor: 'rgba(255,255,255,0.22)',
                '&.Mui-selected': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.14)' },
              },
            }}
          >
            {LANGUAGES.map((lang) => (
              <ToggleButton key={lang.code} value={lang.code} aria-label={lang.label}>
                {lang.short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            onClick={() => navigate('/connexion')}
            sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.4)', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {t('landing.signIn')}
          </Button>
        </Box>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 6 }, py: { xs: 5, md: 9 }, maxWidth: 1240, width: '100%', mx: 'auto' }}>
        <Box sx={{ display: 'grid', gap: { xs: 4, md: 6 }, gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' }, alignItems: 'center' }}>
          <Box>
            <Typography component="h1" sx={{ m: 0 }}>
              <Box component="span" sx={{ display: 'block' }}>
                <FlapTiles value="HESTIM" size="clamp(2.5rem, 8vw, 5rem)" />
              </Box>
              <Box component="span" sx={{ display: 'block', mt: 1.5 }}>
                <FlapTiles value="PLANNER" size="clamp(2.5rem, 8vw, 5rem)" color={ds.brand.orange} />
              </Box>
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.125rem', md: '1.375rem' }, lineHeight: 1.45, maxWidth: '34ch' }}>
              {t('landing.tagline')}
            </Typography>
            <Typography sx={{ mt: 2, color: ds.board.letterDim, fontSize: '1rem', lineHeight: 1.6, maxWidth: '46ch' }}>
              {t('landing.body')}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              endIcon={<ArrowForward />}
              onClick={enter}
              sx={{ mt: 4, minHeight: 52, px: 3, fontSize: '1.0625rem' }}
            >
              {t('landing.cta')}
            </Button>
          </Box>
        </Box>

        {/* La salle réelle : ce que le panneau organise */}
        <PhotoWithCaption
          src="/img/hestim/seance-salle.jpg"
          alt={t('landing.photos.sessionAlt')}
          caption={t('landing.photos.session')}
          sx={{ mt: { xs: 6, md: 9 }, height: { xs: 220, sm: 300, md: 380 } }}
          objectPosition="50% 60%"
          eager
        />

        <Box component="section" aria-labelledby="features-title" sx={{ mt: { xs: 7, md: 11 } }}>
          <Box sx={{ bgcolor: ds.board.frame, p: { xs: '6px', sm: '8px' }, borderRadius: `${ds.radius.lg}px` }}>
            <Typography
              id="features-title"
              component="h2"
              sx={{ px: 1.5, pt: 0.5, pb: 1, color: '#FFFFFF', fontFamily: ds.font.board, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '1.0625rem' }}
            >
              {t('landing.featuresTitle')}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, bgcolor: ds.board.ground, borderRadius: `${ds.radius.md}px` }}>
              {features.map((feature, i) => (
                <Box
                  component="li"
                  key={feature.title}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '16px 1fr', md: '16px minmax(220px, 1fr) 2fr' },
                    columnGap: 2,
                    rowGap: 0.5,
                    alignItems: 'baseline',
                    px: { xs: 2, md: 3 },
                    py: 2,
                    borderBottom: i === features.length - 1 ? 0 : `1px solid ${ds.board.seam}`,
                  }}
                >
                  <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === 0 ? ds.board.live : ds.board.letterDim, alignSelf: 'center' }} />
                  <Typography component="h3" sx={{ fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '1.125rem' }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ gridColumn: { xs: '2', md: 'auto' }, color: ds.board.letterDim, fontSize: '0.9375rem', lineHeight: 1.55 }}>
                    {feature.body}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box component="section" aria-label={t('landing.photos.galleryLabel')} sx={{ mt: { xs: 5, md: 7 }, display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <PhotoWithCaption
            src="/img/hestim/incubateur-ciel.jpg"
            alt={t('landing.photos.incubatorAlt')}
            caption={t('landing.photos.incubator')}
            sx={{ height: { xs: 220, md: 300 } }}
            objectPosition="30% 40%"
          />
          <PhotoWithCaption
            src="/img/hestim/campus-batiment.jpg"
            alt={t('landing.photos.campusAlt')}
            caption={t('landing.photos.campus')}
            sx={{ height: { xs: 220, md: 300 } }}
            objectPosition="50% 35%"
          />
        </Box>
      </Box>

      <Box component="footer" sx={{ px: { xs: 2, md: 6 }, py: 3, borderTop: `1px solid ${ds.board.seam}`, color: ds.board.letterDim, fontSize: '0.875rem' }}>
        © {new Date().getFullYear()} HESTIM Planner · {t('landing.footer')}
      </Box>
    </Box>
  );
}
