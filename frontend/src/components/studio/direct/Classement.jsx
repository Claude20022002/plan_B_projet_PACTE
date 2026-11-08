import { useTranslation } from 'react-i18next';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';

/**
 * Classement du quiz en direct : le podium (trois premiers rangs, égalités comprises), puis la
 * liste des joueurs, et le défi par groupes de TP quand la classe en a.
 */

const rangDe = (t, rang) => (rang === 1 ? t('direct.rang_un') : t('direct.rang', { rang }));

export function Podium({ joueurs }) {
  const { t } = useTranslation();
  const podium = joueurs.filter((j) => j.rang <= 3);
  if (!podium.length) return null;
  return (
    <Stack direction="row" spacing={2} justifyContent="center" alignItems="flex-end" component="ol" aria-label={t('direct.podium')} sx={{ listStyle: 'none', p: 0, m: 0, flexWrap: 'wrap' }}>
      {podium.map((j) => (
        <Paper component="li" key={`${j.prenom}-${j.nom}-${j.rang}`} variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center', borderRadius: 3, borderWidth: j.rang === 1 ? 2 : 1, borderColor: j.rang === 1 ? 'warning.main' : 'divider' }}>
          <EmojiEvents sx={{ fontSize: j.rang === 1 ? 48 : 36, color: j.rang === 1 ? 'warning.main' : 'text.secondary' }} aria-hidden />
          <Typography sx={{ fontWeight: 800 }}>{rangDe(t, j.rang)}</Typography>
          <Typography sx={{ fontWeight: 600 }}>
            {j.prenom} {j.nom}
          </Typography>
          <Typography color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {t('direct.points', { count: j.points })}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

function Liste({ lignes, libelle }) {
  const { t } = useTranslation();
  return (
    <Box component="ol" aria-label={libelle} sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 0.5 }}>
      {lignes.map((l) => (
        <Box component="li" key={l.id_user ?? l.id} sx={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 1.5, py: 0.75, px: 1.5, borderRadius: 2, bgcolor: l.rang <= 3 ? 'action.selected' : 'transparent' }}>
          <Typography sx={{ fontWeight: 700 }}>{rangDe(t, l.rang)}</Typography>
          <Typography noWrap>{l.nom && l.prenom ? `${l.prenom} ${l.nom}` : l.nom}</Typography>
          <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{t('direct.points', { count: l.points })}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function Classement({ classement, equipes = null, limite = 10 }) {
  const { t } = useTranslation();
  if (!classement?.length) return <Typography color="text.secondary">{t('direct.ecran.aucunJoueur')}</Typography>;
  return (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { md: equipes?.length ? '3fr 2fr' : '1fr' } }}>
      <Liste lignes={classement.slice(0, limite)} libelle={t('direct.ecran.classement')} />
      {equipes?.length > 0 && (
        <Box>
          <Typography variant="overline" component="h3" color="text.secondary">
            {t('direct.ecran.equipes')}
          </Typography>
          <Liste lignes={equipes} libelle={t('direct.ecran.equipes')} />
        </Box>
      )}
    </Box>
  );
}
