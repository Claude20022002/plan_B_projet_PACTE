import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, IconButton, Popover, Tooltip } from '@mui/material';
import { Apps, CalendarMonth, LocalLibrary, NorthEast, Quiz } from '@mui/icons-material';
import { ESPACES, adresseEspace } from '../../../../shared/espaces.js';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import useClassQuiz from '../../hooks/useClassQuiz';
import { ds } from '../../design-system/tokens';

const ICONES = { calendar: CalendarMonth, library: LocalLibrary, quiz: Quiz };

// Toutes les pages de ce site, Activités compris, sont dans l'espace Planner
const courant = 'planner';
// Chemin de ce site (la bibliothèque, sous /biblio/, est une autre application sur la même origine)
const estDansPlanner = (adresse) => typeof adresse === 'string' && adresse.startsWith('/') && !adresse.startsWith('/biblio');

/**
 * Sélecteur des espaces HESTIM (Planner, Bibliothèque, Quiz), présent sur chaque page :
 * un geste pour l'ouvrir, un pour choisir. Même liste et même ordre que dans StudyLib, ClassQuiz
 * et l'application mobile (shared/espaces.js). Habillé en petit panneau des départs.
 */
export default function SelecteurEspaces({ role, sx }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const bouton = useRef(null);
  const [ouvert, setOuvert] = useState(false);
  // Adresse de ClassQuiz, lue une fois par page (source commune, lot ME-0c) ; null si éteint pour l'école
  const { url: urlQuiz } = useClassQuiz();

  const espaces = ESPACES.map((e) => ({ ...e, adresse: adresseEspace(e.code, { role, urlQuiz }) })).filter((e) => e.adresse);

  const aller = (espace) => {
    setOuvert(false);
    if (espace.code === courant) return;
    // Planner est cette application, comme « Mes quiz » de l'enseignant ; la bibliothèque et le
    // quiz des étudiants sont d'autres applications
    if (espace.code === 'planner') navigate(role ? `/dashboard/${role}` : '/');
    else if (estDansPlanner(espace.adresse)) navigate(espace.adresse);
    else window.location.assign(espace.adresse);
  };

  return (
    <>
      <Tooltip title={t('espaces.ouvrir')}>
        <IconButton
          ref={bouton}
          onClick={() => setOuvert(true)}
          aria-label={t('espaces.ouvrir')}
          aria-haspopup="true"
          aria-expanded={ouvert}
          sx={{ color: 'inherit', ...sx }}
        >
          <Apps />
        </IconButton>
      </Tooltip>
      <Popover
        open={ouvert}
        anchorEl={bouton.current}
        onClose={() => setOuvert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { bgcolor: ds.board.frame, p: '6px', borderRadius: `${ds.radius.lg}px`, width: 340, maxWidth: 'calc(100vw - 24px)' } } }}
      >
        <Box
          component="h2"
          sx={{ m: 0, px: 1, pt: 0.25, pb: 0.75, color: '#FFFFFF', fontFamily: ds.font.board, fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          {t('espaces.titre')}
        </Box>
        <Box component="nav" aria-label={t('espaces.titre')} sx={{ bgcolor: ds.board.ground, borderRadius: `${ds.radius.md}px` }}>
          {espaces.map((e, index) => {
            const Icone = ICONES[e.icone];
            const ici = e.code === courant;
            const externe = !estDansPlanner(e.adresse) && e.code !== 'planner';
            return (
              <ButtonBase
                key={e.code}
                onClick={() => aller(e)}
                aria-current={ici ? 'page' : undefined}
                sx={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '18px 28px 1fr auto',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.25,
                  py: 1.25,
                  minHeight: 56,
                  textAlign: 'left',
                  borderTop: index ? `1px solid ${ds.board.seam}` : 'none',
                  color: ds.board.letter,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                  '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: -2 },
                }}
              >
                {/* Lampe : vous êtes ici */}
                <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', justifySelf: 'center', bgcolor: ici ? ds.board.live : 'transparent', border: ici ? 'none' : `1px solid ${ds.board.seam}` }} />
                <Icone sx={{ color: ici ? ds.board.letter : ds.board.letterDim }} />
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '1.0625rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {libelle(e.titre, i18n.language)}
                  </Box>
                  <Box sx={{ fontSize: '0.8125rem', color: ds.board.letterDim, lineHeight: 1.35 }}>
                    {ici ? t('espaces.ici') : libelle(e.resume, i18n.language)}
                  </Box>
                </Box>
                {externe ? <NorthEast aria-hidden sx={{ fontSize: 16, color: ds.board.letterDim }} /> : <span />}
              </ButtonBase>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
