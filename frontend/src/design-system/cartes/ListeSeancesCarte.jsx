import { Fragment } from 'react';
import { Box, Skeleton, useMediaQuery } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';
import { formatDayLabel, toLocalISODate } from '../../utils/session';
import CarteSection from './CarteSection';
import Horloge from './Horloge';
import { CelluleSeance } from './LigneSeance';
import { largeurColonne } from './styles';

/**
 * Séances dans une carte (DESIGN.md, Liste des séances ; remplace le panneau des départs) :
 * tableau sémantique, séances groupées sous un bandeau de jour, la séance en vedette sur un voile vert.
 * `columns` choisit les colonnes parmi time, course, group, room, teacher, status.
 */
export default function ListeSeancesCarte({
  id = 'liste-seances',
  title,
  sessions = [],
  showClock = true,
  columns = ['time', 'course', 'room', 'status'],
  spotlight = null,
  groupDays = true,
  loading = false,
  empty,
  onSessionClick,
  caption,
}) {
  const { t, i18n } = useTranslation();
  const compact = useMediaQuery('(max-width:599.95px)');
  const today = toLocalISODate();
  const tomorrow = toLocalISODate(new Date(Date.now() + 86400000));
  const colonnes = compact ? columns.filter((c) => !['group', 'teacher'].includes(c)) : columns;
  const largeurs = largeurColonne(compact);

  const entetes = { time: t('board.time'), course: t('board.course'), room: t('board.room'), group: t('board.group'), teacher: t('board.teacher'), status: t('board.status') };
  const cellule = { borderBottom: '1px solid', borderColor: 'divider', py: compact ? 1.25 : 1.5, px: compact ? 1 : 1.5, verticalAlign: 'middle' };
  const libelleJour = (date) => (date === today ? t('common.today') : date === tomorrow ? t('common.tomorrow') : formatDayLabel(date, i18n.language));

  const jours = groupDays
    ? sessions.reduce((acc, s) => {
        const dernier = acc[acc.length - 1];
        if (dernier && dernier.date === s.date) dernier.items.push(s);
        else acc.push({ date: s.date, items: [s] });
        return acc;
      }, [])
    : [{ date: null, items: sessions }];

  return (
    <CarteSection id={id} titre={title} action={showClock ? <Horloge /> : null}>
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: compact ? 0 : 560, '& tbody tr:last-of-type > *': { borderBottom: 0 } }}>
          {caption && (
            <Box component="caption" sx={visuallyHidden}>
              {caption}
            </Box>
          )}
          <colgroup>
            {colonnes.map((c) => (
              <col key={c} style={largeurs[c] ? { width: largeurs[c] } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {colonnes.map((c) => (
                <Box key={c} component="th" scope="col" sx={{ ...cellule, py: 1, textAlign: c === 'status' ? 'right' : 'left', fontFamily: ds.font.board, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'action.hover' }}>
                  {entetes[c]}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2].map((i) => (
                <tr key={`sk-${i}`}>
                  <Box component="td" colSpan={colonnes.length} sx={cellule}>
                    <Skeleton variant="rounded" height={28} />
                  </Box>
                </tr>
              ))}

            {!loading && sessions.length === 0 && empty && (
              <tr>
                <Box component="td" colSpan={colonnes.length} sx={{ ...cellule, py: 4, px: { xs: 2, sm: 3 } }}>
                  {empty}
                </Box>
              </tr>
            )}

            {!loading &&
              jours.map((jour) => (
                <Fragment key={jour.date || 'tout'}>
                  {groupDays && jour.date && (
                    <tr>
                      <Box component="th" scope="colgroup" colSpan={colonnes.length} sx={{ ...cellule, py: 0.75, textAlign: 'left', fontFamily: ds.font.board, fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: jour.date === today ? 'primary.main' : 'text.secondary' }}>
                        {libelleJour(jour.date)}
                      </Box>
                    </tr>
                  )}
                  {jour.items.map((s) => {
                    const vedette = spotlight?.session?.id === s.id;
                    return (
                      <Box
                        component="tr"
                        key={s.id}
                        onClick={onSessionClick ? () => onSessionClick(s) : undefined}
                        sx={{
                          cursor: onSessionClick ? 'pointer' : 'default',
                          bgcolor: vedette ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(63, 203, 116, 0.08)' : ds.status.confirme.bureauBg) : 'transparent',
                          '&:hover': onSessionClick ? { bgcolor: 'action.hover' } : undefined,
                        }}
                      >
                        {colonnes.map((c) => (
                          <Box component="td" key={c} sx={cellule}>
                            <CelluleSeance colonne={c} s={s} colonnes={columns} compact={compact} phase={vedette ? spotlight.phase : undefined} />
                          </Box>
                        ))}
                      </Box>
                    );
                  })}
                </Fragment>
              ))}
          </tbody>
        </Box>
      </Box>
    </CarteSection>
  );
}
