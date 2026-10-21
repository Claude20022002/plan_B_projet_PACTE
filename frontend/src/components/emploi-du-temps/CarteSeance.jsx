import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { StatusFlap } from '../../design-system/board';
import { ds } from '../../design-system/tokens';
import { couleurDuModule } from './couleurs';

/**
 * Une séance de l'emploi du temps en carte claire (retour du 21 octobre, R-7) : fond de la
 * surface à peine teinté, liseré de la couleur du module, texte du thème (clair ou sombre).
 * Le noir du panneau des départs reste réservé au tableau du jour.
 *
 * variante « grille » : remplit la case de la grille hebdomadaire (cours, heure · salle) ;
 * variante « liste »  : une ligne de la liste du jour (horaire, cours, salle, groupe ou enseignant).
 */

// Le statut ne s'affiche que s'il dit quelque chose : une séance planifiée n'a pas de pastille
const statutVisible = (status) => status && status !== 'planifie';

const sxCours = (annulee) => ({
  fontWeight: 600,
  lineHeight: 1.25,
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  color: annulee ? 'text.secondary' : 'text.primary',
  textDecoration: annulee ? 'line-through' : 'none',
});

const sxHoraire = {
  fontFamily: ds.font.board,
  fontWeight: 600,
  letterSpacing: '0.04em',
  fontVariantNumeric: 'tabular-nums',
  color: 'text.secondary',
};

/** Rend la carte d'une séance ; columns choisit les détails (« group », « teacher ») de la liste. */
export default function CarteSeance({ session, variante = 'grille', columns = [] }) {
  const { t } = useTranslation();
  const couleur = couleurDuModule(session);
  const annulee = session.status === 'annule';
  const details = [
    columns.includes('group') ? session.group : null,
    columns.includes('teacher') ? session.teacher : null,
  ].filter(Boolean);

  const fond = {
    bgcolor: (theme) => alpha(couleur, theme.palette.mode === 'dark' ? 0.16 : 0.07),
    borderLeft: `4px solid ${couleur}`,
    borderRadius: `${ds.radius.sm}px`,
    color: 'text.primary',
    opacity: annulee ? 0.75 : 1,
  };

  if (variante === 'grille') {
    return (
      <Box sx={{ ...fond, height: '100%', p: '4px 6px 4px 8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Box component="span" sx={{ ...sxCours(annulee), fontSize: '0.8125rem' }}>
          {session.course}
        </Box>
        <Box component="span" sx={{ ...sxHoraire, fontSize: '0.8125rem' }}>
          {session.startLabel} · {session.room}
        </Box>
        {statutVisible(session.status) && (
          <Box sx={{ mt: 'auto' }}>
            <StatusFlap status={session.status} variant="bureau" />
          </Box>
        )}
        <Box component="span" sx={visuallyHidden}>
          {[session.teacher, session.group, t(`status.${session.status}`)].filter(Boolean).join(', ')}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...fond,
        display: 'grid',
        gridTemplateColumns: { xs: '58px 1fr', sm: '96px 1fr auto' },
        columnGap: 1.5,
        rowGap: 0.5,
        alignItems: 'center',
        px: 1.5,
        py: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        borderLeftWidth: 4,
        borderLeftColor: couleur,
      }}
    >
      <Box sx={{ ...sxHoraire, fontSize: { xs: '0.875rem', sm: '1rem' }, color: 'text.primary' }}>
        {session.startLabel}
        <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' }, color: 'text.secondary' }}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> – </Box>
          {session.endLabel}
        </Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ ...sxCours(annulee), fontSize: '0.9375rem' }}>{session.course}</Box>
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.25 }}>
          <Box component="span" sx={{ ...sxHoraire, color: 'text.primary', fontSize: '0.9375rem' }}>
            {session.room || '-'}
          </Box>
          {details.length > 0 && ` · ${details.join(' · ')}`}
        </Box>
      </Box>
      {statutVisible(session.status) && (
        <Box sx={{ gridColumn: { xs: '2', sm: 'auto' }, justifySelf: { xs: 'start', sm: 'end' } }}>
          <StatusFlap status={session.status} variant="bureau" />
        </Box>
      )}
    </Box>
  );
}
