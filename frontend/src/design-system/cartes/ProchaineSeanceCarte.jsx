import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DetailSeance from './DetailSeance';
import PastilleEtat from './PastilleEtat';
import { carteSx, ombreRelevee } from './styles';

/**
 * La séance en cours ou la prochaine, en tête du tableau (DESIGN.md, Prochaine séance) : carte
 * relevée en clair, titrée « En cours » ou « Prochaine », avec le détail de la séance et ses actions.
 * `phase` vaut « live » (en cours) ou « next » (prochaine).
 */
export default function ProchaineSeanceCarte({ id = 'prochaine-seance', session, phase, actions }) {
  const { t } = useTranslation();
  return (
    <Box component="section" aria-labelledby={id} sx={{ ...carteSx, boxShadow: ombreRelevee }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: { xs: 2, sm: 3 }, pt: 2 }}>
        <Typography id={id} component="h2" sx={{ fontWeight: 600, fontSize: '1.0625rem', color: 'text.secondary' }}>
          {t(phase === 'live' ? 'status.live' : 'status.next')}
        </Typography>
        {/* Le titre dit déjà « En cours » ou « Prochaine » : la pastille ne signale qu'un report ou une annulation */}
        {session.status !== 'planifie' && session.status !== 'confirme' && <PastilleEtat status={session.status} />}
      </Box>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.5, pb: { xs: 2, sm: 2.5 } }}>
        <DetailSeance session={session} phase={phase} actions={actions} />
      </Box>
    </Box>
  );
}
