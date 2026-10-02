import { Fragment, useEffect, useState } from 'react';
import { Box, Skeleton, useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds, lineColor } from '../tokens';
import { formatDayLabel, toLocalISODate } from '../../utils/session';
import FlapTiles from './FlapTiles';
import FlapText from './FlapText';
import StatusFlap from './StatusFlap';

/**
 * Panneau des départs : chaque séance est une ligne, les colonnes ne bougent jamais.
 * Tableau HTML sémantique (lisible et navigable au lecteur d'écran) habillé en panneau.
 *
 * variant « board »  : panneau noir encadré de bleu marine (étudiants, enseignants, accueil)
 * variant « bureau » : même système en clair (écrans de gestion de l'administration)
 */

const LAMP_COLORS = {
  live: ds.board.live,
  next: ds.board.live,
  reporte: ds.board.delayed,
  annule: ds.board.cancelled,
};

function Clock({ language }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const label = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(now);
  return <FlapText value={label} />;
}

export default function DepartureBoard({
  sessions = [],
  variant = 'board',
  title,
  showClock = true,
  columns = ['time', 'course', 'room', 'status'],
  spotlight = null,
  renderSpotlight,
  groupDays = true,
  loading = false,
  empty,
  onSessionClick,
  caption,
}) {
  const { t, i18n } = useTranslation();
  const isBoard = variant === 'board';
  const compact = useMediaQuery('(max-width:599.95px)');
  const today = toLocalISODate();
  const tomorrow = toLocalISODate(new Date(Date.now() + 86400000));

  // Sur téléphone, groupe et enseignant passent sous le nom du cours
  const visibleColumns = compact ? columns.filter((c) => c !== 'group' && c !== 'teacher') : columns;
  const colCount = visibleColumns.length + 1; // + colonne de lampe

  const palette = isBoard
    ? { ground: ds.board.ground, text: ds.board.letter, dim: ds.board.letterDim, seam: ds.board.seam, head: ds.board.letterDim }
    : { ground: ds.colors.bg.surface, text: ds.colors.text.primary, dim: ds.colors.text.muted, seam: ds.colors.border.default, head: ds.colors.text.secondary };

  const headerLabel = {
    time: t('board.time'),
    course: t('board.course'),
    room: t('board.room'),
    group: t('board.group'),
    teacher: t('board.teacher'),
    status: t('board.status'),
  };

  const cellBase = {
    borderBottom: `1px solid ${palette.seam}`,
    py: compact ? 1.25 : 1.5,
    px: compact ? 1 : 1.5,
    verticalAlign: 'middle',
    color: palette.text,
  };

  const dayLabel = (date) => {
    if (date === today) return t('common.today');
    if (date === tomorrow) return t('common.tomorrow');
    return formatDayLabel(date, i18n.language);
  };

  const renderCell = (column, s, dimmed) => {
    switch (column) {
      case 'time':
        return (
          <FlapTiles
            value={s.startLabel}
            variant={variant}
            size={compact ? '0.95rem' : '1.05rem'}
            color={dimmed ? palette.dim : undefined}
          />
        );
      case 'course':
        return (
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box
                component="span"
                aria-hidden="true"
                sx={{ width: 10, height: 10, flexShrink: 0, borderRadius: '2px', bgcolor: lineColor(s.lineKey) }}
              />
              <Box
                component="span"
                sx={{
                  fontFamily: ds.font.board,
                  fontWeight: 600,
                  fontSize: compact ? '0.95rem' : '1.05rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: dimmed ? palette.dim : palette.text,
                  textDecoration: s.status === 'annule' ? 'line-through' : 'none',
                  textDecorationColor: ds.board.cancelled,
                }}
              >
                {s.course}
              </Box>
            </Box>
            {(compact || !columns.includes('teacher')) && (s.teacher || s.group) && (
              <Box
                sx={{
                  mt: 0.25,
                  pl: '18px',
                  fontSize: '0.8125rem',
                  color: palette.dim,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {[columns.includes('group') ? s.group : null, s.teacher].filter(Boolean).join(' · ')}
              </Box>
            )}
          </Box>
        );
      case 'room':
        return (
          <Box sx={{ lineHeight: 1.2 }}>
            <Box
              component="span"
              sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: compact ? '0.95rem' : '1.05rem', letterSpacing: '0.04em' }}
            >
              {s.room || '—'}
            </Box>
            {s.building && (
              <Box sx={{ fontSize: '0.75rem', color: palette.dim, whiteSpace: 'nowrap' }}>{s.building}</Box>
            )}
          </Box>
        );
      case 'group':
        return <Box sx={{ fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.04em' }}>{s.group}</Box>;
      case 'teacher':
        return <Box sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{s.teacher}</Box>;
      case 'status':
        return (
          <Box sx={{ fontSize: compact ? '0.875rem' : '0.95rem', textAlign: 'right' }}>
            <StatusFlap
              status={s.status}
              variant={variant}
              phase={spotlight?.session?.id === s.id ? spotlight.phase : undefined}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const columnWidth = {
    time: compact ? 62 : 84,
    room: compact ? 74 : 120,
    group: 110,
    teacher: 190,
    status: compact ? 92 : 132,
  };

  const groups = groupDays
    ? sessions.reduce((acc, s) => {
        const last = acc[acc.length - 1];
        if (last && last.date === s.date) last.items.push(s);
        else acc.push({ date: s.date, items: [s] });
        return acc;
      }, [])
    : [{ date: null, items: sessions }];

  return (
    <Box
      className={isBoard ? 'hp-board' : undefined}
      sx={{
        bgcolor: isBoard ? ds.board.frame : 'transparent',
        p: isBoard ? { xs: '6px', sm: '8px' } : 0,
        borderRadius: `${ds.radius.lg}px`,
        border: isBoard ? 'none' : `1px solid ${ds.colors.border.default}`,
        overflow: 'hidden',
      }}
    >
      {(title || showClock) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 1, sm: 1.5 },
            pt: isBoard ? 0.5 : 1.5,
            pb: isBoard ? 1 : 1.5,
            color: isBoard ? '#FFFFFF' : palette.text,
            bgcolor: isBoard ? 'transparent' : palette.ground,
            borderBottom: isBoard ? 'none' : `1px solid ${palette.seam}`,
            fontFamily: ds.font.board,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          <Box component="h2" sx={{ m: 0, font: 'inherit', letterSpacing: 'inherit' }}>
            {title}
          </Box>
          {showClock && (
            <Box component="span" sx={{ fontSize: '1rem', opacity: 0.9 }}>
              <Clock language={i18n.language} />
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ bgcolor: palette.ground, borderRadius: isBoard ? `${ds.radius.md}px` : 0, overflowX: 'auto' }}>
        <Box
          component="table"
          sx={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: compact ? 0 : 560 }}
        >
          {caption && (
            <Box component="caption" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              {caption}
            </Box>
          )}
          <colgroup>
            <col style={{ width: compact ? 18 : 26 }} />
            {visibleColumns.map((c) => (
              <col key={c} style={columnWidth[c] ? { width: columnWidth[c] } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <Box component="th" scope="col" sx={{ ...cellBase, py: 1 }}>
                <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                  {t('board.status')}
                </Box>
              </Box>
              {visibleColumns.map((c) => (
                <Box
                  key={c}
                  component="th"
                  scope="col"
                  sx={{
                    ...cellBase,
                    py: 1,
                    textAlign: c === 'status' ? 'right' : 'left',
                    fontFamily: ds.font.board,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: palette.head,
                  }}
                >
                  {headerLabel[c]}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={`sk-${i}`}>
                  <Box component="td" colSpan={colCount} sx={cellBase}>
                    <Skeleton
                      variant="rectangular"
                      height={28}
                      sx={{ bgcolor: isBoard ? ds.board.cell : undefined, borderRadius: '2px' }}
                    />
                  </Box>
                </tr>
              ))}

            {!loading && sessions.length === 0 && empty && (
              <tr>
                <Box component="td" colSpan={colCount} sx={{ ...cellBase, py: 4, px: { xs: 2, sm: 3 } }}>
                  {empty}
                </Box>
              </tr>
            )}

            {!loading &&
              groups.map((group) => (
                <Fragment key={group.date || 'all'}>
                  {groupDays && group.date && (
                    <tr>
                      <Box
                        component="th"
                        scope="colgroup"
                        colSpan={colCount}
                        sx={{
                          ...cellBase,
                          py: 0.75,
                          textAlign: 'left',
                          fontFamily: ds.font.board,
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: group.date === today ? (isBoard ? '#FFFFFF' : ds.brand.navy) : palette.dim,
                          bgcolor: isBoard ? 'rgba(242, 241, 236, 0.03)' : ds.colors.bg.subtle,
                        }}
                      >
                        {dayLabel(group.date)}
                      </Box>
                    </tr>
                  )}
                  {group.items.map((s) => {
                    const isSpot = spotlight?.session?.id === s.id;
                    const lamp = isSpot ? LAMP_COLORS[spotlight.phase] : LAMP_COLORS[s.status];
                    const dimmed = s.status === 'annule';
                    return (
                      <Fragment key={s.id}>
                        <Box
                          component="tr"
                          onClick={onSessionClick ? () => onSessionClick(s) : undefined}
                          sx={{
                            cursor: onSessionClick ? 'pointer' : 'default',
                            bgcolor: isSpot ? (isBoard ? 'rgba(63, 203, 116, 0.07)' : '#EEF6F1') : 'transparent',
                            '&:hover': onSessionClick
                              ? { bgcolor: isBoard ? 'rgba(242, 241, 236, 0.05)' : '#F6F7FA' }
                              : undefined,
                          }}
                        >
                          <Box component="td" sx={{ ...cellBase, pr: 0, textAlign: 'center' }}>
                            {lamp && (
                              <Box
                                component="span"
                                aria-hidden="true"
                                sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: lamp }}
                              />
                            )}
                          </Box>
                          {visibleColumns.map((c) => (
                            <Box component="td" key={c} sx={cellBase}>
                              {renderCell(c, s, dimmed)}
                            </Box>
                          ))}
                        </Box>
                        {isSpot && renderSpotlight && (
                          <tr>
                            <Box component="td" colSpan={colCount} sx={{ ...cellBase, p: 0 }}>
                              {renderSpotlight(s, spotlight.phase)}
                            </Box>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}
