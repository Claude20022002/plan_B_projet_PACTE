import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';
import { relativeTo } from '../../utils/session';

const TONE = {
  warning: ds.colors.warning,
  error: ds.colors.danger,
  success: ds.colors.success,
  info: ds.colors.info,
};

/**
 * Avis de changement (notifications non lues) : ce qui a bougé depuis la dernière visite.
 * Chaque avis mène à l'écran concerné quand un lien est fourni.
 */
export default function ChangesList({ items = [], onSeeAll }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      component="section"
      aria-labelledby="changes-title"
      sx={{
        alignSelf: 'start',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${ds.radius.lg}px`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography
          id="changes-title"
          component="h2"
          sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          {t('board.changesTitle')}
        </Typography>
        {onSeeAll && (
          <Button size="small" onClick={onSeeAll}>
            {t('common.seeAll')}
          </Button>
        )}
      </Box>

      {items.length === 0 ? (
        <Typography sx={{ px: 2, py: 2.5, color: 'text.secondary', fontSize: '0.9375rem' }}>{t('board.noChanges')}</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {items.map((item) => {
            const tone = TONE[item.type_notification] || TONE.info;
            const content = (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%', px: 2, py: 1.5, textAlign: 'left' }}>
                <Box
                  component="span"
                  aria-hidden="true"
                  sx={{ mt: '7px', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: tone.text }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.35 }}>{item.titre}</Typography>
                  <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.45 }}>{item.message}</Typography>
                  {item.date_envoi && (
                    <Typography sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.8125rem' }}>
                      {relativeTo(new Date(item.date_envoi), i18n.language)}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
            return (
              <Box component="li" key={item.id_notification} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
                {item.lien ? (
                  <ButtonBase
                    onClick={() => navigate(item.lien)}
                    sx={{ width: '100%', display: 'block', '&:hover': { bgcolor: 'action.hover' } }}
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
