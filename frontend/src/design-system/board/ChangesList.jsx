import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';
import { relativeTo } from '../../utils/session';

const TONE = {
  warning: { bureau: ds.colors.warning.text, board: ds.board.delayed },
  error: { bureau: ds.colors.danger.text, board: ds.board.cancelled },
  success: { bureau: ds.colors.success.text, board: ds.board.live },
  info: { bureau: ds.colors.info.text, board: ds.board.letter },
};

/**
 * Avis de changement (notifications non lues) : ce qui a bougé depuis la dernière visite.
 * Chaque avis mène à l'écran concerné quand un lien est fourni.
 * variant « bureau » : panneau clair à côté du tableau ; « board » : inséré dans le panneau noir,
 * juste sous la séance en vedette (téléphone).
 */
export default function ChangesList({ items = [], onSeeAll, variant = 'bureau' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isBoard = variant === 'board';
  const line = isBoard ? ds.board.seam : 'divider';
  const dim = isBoard ? ds.board.letterDim : 'text.secondary';

  return (
    <Box
      component="section"
      aria-labelledby={`changes-title-${variant}`}
      sx={{
        alignSelf: 'start',
        bgcolor: isBoard ? 'transparent' : 'background.paper',
        color: isBoard ? ds.board.letter : 'text.primary',
        border: isBoard ? 0 : '1px solid',
        borderTop: isBoard ? `1px solid ${ds.board.seam}` : undefined,
        borderColor: line,
        borderRadius: isBoard ? 0 : `${ds.radius.lg}px`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: line }}>
        <Typography
          id={`changes-title-${variant}`}
          component="h2"
          sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: isBoard ? ds.board.delayed : 'inherit' }}
        >
          {t('board.changesTitle')}
        </Typography>
        {onSeeAll && (
          <Button size="small" onClick={onSeeAll} sx={isBoard ? { color: ds.board.letter } : undefined}>
            {t('common.seeAll')}
          </Button>
        )}
      </Box>

      {items.length === 0 ? (
        <Typography sx={{ px: 2, py: 2.5, color: dim, fontSize: '0.9375rem' }}>{t('board.noChanges')}</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {items.map((item) => {
            const tone = (TONE[item.type_notification] || TONE.info)[isBoard ? 'board' : 'bureau'];
            const content = (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%', px: 2, py: 1.5, textAlign: 'left' }}>
                <Box component="span" aria-hidden="true" sx={{ mt: '7px', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: tone }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.35 }}>{item.titre}</Typography>
                  <Typography sx={{ mt: 0.25, color: dim, fontSize: '0.875rem', lineHeight: 1.45 }}>{item.message}</Typography>
                  {item.date_envoi && (
                    <Typography sx={{ mt: 0.5, color: dim, fontSize: '0.8125rem' }}>
                      {relativeTo(new Date(item.date_envoi), i18n.language)}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
            return (
              <Box component="li" key={item.id_notification} sx={{ borderBottom: '1px solid', borderColor: line, '&:last-of-type': { borderBottom: 0 } }}>
                {item.lien ? (
                  <ButtonBase
                    onClick={() => navigate(item.lien)}
                    sx={{ width: '100%', display: 'block', '&:hover': { bgcolor: isBoard ? 'rgba(242, 241, 236, 0.05)' : 'action.hover' } }}
                  >
                    {content}
                  </ButtonBase>
                ) : (
                  content
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
