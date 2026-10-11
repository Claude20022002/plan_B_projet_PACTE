import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Skeleton, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { formatDayLabel } from '../../utils/session';
import { ds } from '../../design-system/tokens';

const sectionTitleSx = {
  fontFamily: ds.font.board,
  fontWeight: 700,
  fontSize: '1rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

/** Une ligne de la file : pastille de couleur, titre, détail, et la page où traiter. */
function Ligne({ tone, title, detail, onClick }) {
  return (
    <Box component="li" sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <ButtonBase onClick={onClick} sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 1.5, textAlign: 'left', '&:hover': { bgcolor: 'action.hover' } }}>
        <Box component="span" aria-hidden="true" sx={{ mt: '7px', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: tone }} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.35 }}>{title}</Typography>
          <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {detail}
          </Typography>
        </Box>
        <ArrowForward fontSize="small" sx={{ mt: '2px', color: 'text.secondary' }} />
      </ButtonBase>
    </Box>
  );
}

/**
 * File « À traiter » du tableau de bord de l'administration (R-9), du plus urgent au moins urgent :
 * conflits ouverts, demandes de report, téléphones à changer (R-10), séances du mois sans appel
 * validé à confirmer ou écarter avant la paie (R-11). Chaque ligne mène à la page où la traiter.
 */
export default function FileATraiter({ conflicts, conflictsTotal, reports, telephones = [], aVerifier = 0, loading }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const empty = !loading && conflicts.length === 0 && reports.length === 0 && telephones.length === 0 && aVerifier === 0;

  return (
    <Box component="section" aria-labelledby="queue-title" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.lg}px`, alignSelf: 'start' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography id="queue-title" component="h2" sx={sectionTitleSx}>
          {t('admin.toHandle')}
        </Typography>
        {!loading && !empty && (
          <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.875rem' }}>
            {[
              conflictsTotal ? t('admin.openConflicts', { count: conflictsTotal }) : null,
              reports.length ? t('admin.pendingReports', { count: reports.length }) : null,
              telephones.length ? t('admin.pendingPhones', { count: telephones.length }) : null,
              aVerifier ? t('admin.sessionsToCheck', { count: aVerifier }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        )}
      </Box>

      {loading && (
        <Box sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: '3px' }} />
          ))}
        </Box>
      )}

      {empty && <Typography sx={{ px: 2, py: 2.5, color: 'text.secondary', fontSize: '0.9375rem' }}>{t('admin.nothingToHandle')}</Typography>}

      {!loading && !empty && (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {conflicts.map((c) => (
            <Ligne
              key={`c-${c.id_conflit}`}
              tone={ds.colors.danger.text}
              title={t(`admin.conflictType.${c.type_conflit}`, { defaultValue: c.type_conflit })}
              detail={c.description}
              onClick={() => navigate('/gestion/conflits')}
            />
          ))}
          {reports.map((r) => (
            <Ligne
              key={`r-${r.id_demande}`}
              tone={ds.colors.warning.text}
              title={t('admin.reportTitle', {
                teacher: [r.enseignant?.prenom, r.enseignant?.nom].filter(Boolean).join(' ') || '-',
              })}
              detail={[
                r.affectation?.cours?.nom_cours,
                r.nouvelle_date ? t('admin.reportTo', { date: formatDayLabel(String(r.nouvelle_date).slice(0, 10), i18n.language) }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              onClick={() => navigate('/gestion/demandes-report')}
            />
          ))}
          {telephones.map((d) => (
            <Ligne
              key={`t-${d.id}`}
              tone={ds.colors.warning.text}
              title={t('admin.phoneTitle', { student: d.etudiant?.nom ?? '-' })}
              detail={d.motif || t('admin.phoneDetail')}
              onClick={() => navigate('/gestion/signalements-presence')}
            />
          ))}
          {aVerifier > 0 && (
            <Ligne
              key="a-verifier"
              tone={ds.colors.warning.text}
              title={t('admin.sessionsToCheckTitle', { count: aVerifier })}
              detail={t('admin.sessionsToCheckDetail')}
              onClick={() => navigate('/gestion/suivi?onglet=heures')}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
