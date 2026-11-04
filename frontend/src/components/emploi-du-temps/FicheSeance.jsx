import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { StatusFlap, SupportsCours } from '../../design-system/board';
import { ds } from '../../design-system/tokens';
import { couleurDuModule } from './couleurs';
import { localeEcran } from '../../utils/dates';
import LienVisio from './LienVisio';

/**
 * Fiche d'une séance de l'emploi du temps, ouverte depuis la grille ou la liste : la salle en
 * grand (« où dois-je être ? »), puis quand, quoi et avec qui. Sur la surface du thème, comme les
 * cartes (R-7) : plus de panneau noir dans l'emploi du temps.
 */

const sxLibelle = {
  fontFamily: ds.font.board,
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

/** Rend la fiche de session dans un dialogue ; onClose la ferme ; onLienVisio(id, lien) signale un lien de visio changé. */
export default function FicheSeance({ session: s, onClose, onLienVisio }) {
  const { t, i18n } = useTranslation();
  const ouvert = Boolean(s);

  const ou = s
    ? [s.building, s.floor !== null && s.floor !== undefined ? t('board.floor', { floor: s.floor }) : null].filter(Boolean).join(' · ')
    : '';

  return (
    <Dialog open={ouvert} onClose={onClose} maxWidth="sm" fullWidth>
      {s && (
        <>
          <DialogTitle sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, fontFamily: ds.font.board, fontWeight: 700, '&::first-letter': { textTransform: 'uppercase' } }}>
            {new Intl.DateTimeFormat(localeEcran(i18n.language), { weekday: 'long', day: 'numeric', month: 'long' }).format(s.start)}
            <StatusFlap status={s.status} variant="bureau" />
          </DialogTitle>
          <DialogContent dividers sx={{ borderLeft: `4px solid ${couleurDuModule(s)}` }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, columnGap: 4, rowGap: 2, alignItems: 'start' }}>
              <Box>
                <Box sx={{ ...sxLibelle, mb: 0.5 }}>{t('board.room')}</Box>
                <Box sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(2rem, 9vw, 2.75rem)', lineHeight: 1, letterSpacing: '0.04em' }}>
                  {s.room || '-'}
                </Box>
                {ou && <Box sx={{ mt: 1, fontSize: '0.9375rem', color: 'text.secondary' }}>{ou}</Box>}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>
                  {`${s.startLabel} – ${s.endLabel}`}
                  {s.durationMin ? <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>{` · ${s.durationMin} min`}</Box> : null}
                </Box>
                <Box sx={{ mt: 0.5, fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.35, textDecoration: s.status === 'annule' ? 'line-through' : 'none' }}>
                  {s.course}
                </Box>
                <Box sx={{ mt: 0.5, fontSize: '0.9375rem', color: 'text.secondary' }}>{[s.teacher, s.group].filter(Boolean).join(' · ')}</Box>
                {s.previousLabel && (
                  <Box component="del" sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
                    {t('board.previously', { value: s.previousLabel })}
                  </Box>
                )}
                <SupportsCours code={s.courseCode} color="primary.main" />
                <LienVisio session={s} onChange={onLienVisio} />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('common.close')}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
