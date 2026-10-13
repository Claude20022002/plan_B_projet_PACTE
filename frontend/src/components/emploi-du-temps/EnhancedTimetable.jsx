import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, Print, TableRows, ViewWeek } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { DetailSeance, ListeSeancesCarte, PastilleEtat } from '../../design-system/cartes';
import { ds, lineColor } from '../../design-system/tokens';
import { byStart, toBoardSession } from '../../utils/session';
import { visuallyHidden } from '@mui/utils';

/**
 * Emploi du temps hebdomadaire :
 * - ordinateur : grille lundi → samedi à échelle horaire fixe (toutes les semaines comparables),
 *   chaque séance sur un voile de la couleur de sa filière ;
 * - téléphone (ou vue liste) : la liste des séances dans une carte, jour par jour.
 * S'ouvre sur la semaine qui contient effectivement des séances.
 */

const mondayOf = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Semaine initiale : la semaine courante si elle a des séances, sinon celle de la prochaine séance */
const initialWeek = (sessions) => {
  const thisWeek = mondayOf(new Date());
  const weekEnd = addDays(thisWeek, 7);
  const hasThisWeek = sessions.some((s) => s.start >= thisWeek && s.start < weekEnd);
  if (hasThisWeek || sessions.length === 0) return thisWeek;
  const next = sessions.find((s) => s.start >= new Date());
  return mondayOf(next ? next.start : sessions[sessions.length - 1].start);
};

/** Une séance dans la grille : voile et filet de la couleur de sa filière, état seulement s'il a changé. */
function EventCell({ session }) {
  const { t } = useTranslation();
  const changed = session.status === 'reporte' || session.status === 'annule';
  const couleur = lineColor(session.lineKey);
  return (
    <Box
      sx={{
        height: '100%',
        p: '4px 6px 4px 8px',
        bgcolor: (theme) => alpha(couleur, theme.palette.mode === 'dark' ? 0.22 : 0.12),
        borderLeft: `3px solid ${couleur}`,
        color: 'text.primary',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <Box
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: '0.8125rem',
          lineHeight: 1.25,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          textDecoration: session.status === 'annule' ? 'line-through' : 'none',
          color: session.status === 'annule' ? 'text.secondary' : 'text.primary',
        }}
      >
        {session.course}
      </Box>
      <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {session.startLabel} · {session.room}
      </Box>
      {changed && (
        <Box sx={{ mt: 'auto' }}>
          <PastilleEtat status={session.status} />
        </Box>
      )}
      <Box component="span" sx={visuallyHidden}>
        {[session.teacher, session.group, t(`status.${session.status}`)].filter(Boolean).join(', ')}
      </Box>
    </Box>
  );
}

export default function EnhancedTimetable({ affectations = [], actions, columns = ['time', 'course', 'room', 'teacher', 'status'] }) {
  const { t, i18n } = useTranslation();
  const compact = useMediaQuery('(max-width:899.95px)');
  const calendarRef = useRef(null);
  const sessions = useMemo(() => affectations.map(toBoardSession).filter((s) => s.start).sort(byStart), [affectations]);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [weekResolved, setWeekResolved] = useState(false);
  const [mode, setMode] = useState('grid');
  const [selected, setSelected] = useState(null);

  // Positionne la semaine dès que les séances sont connues (une seule fois)
  useEffect(() => {
    if (!weekResolved && sessions.length > 0) {
      setWeekStart(initialWeek(sessions));
      setWeekResolved(true);
    }
  }, [sessions, weekResolved]);

  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(weekStart);
  }, [weekStart, mode, compact]);

  const weekEnd = addDays(weekStart, 7);
  const weekSessions = sessions.filter((s) => s.start >= weekStart && s.start < weekEnd);
  const showList = compact || mode === 'list';

  const events = weekSessions.map((s) => ({
    id: String(s.id),
    start: s.start,
    end: s.end,
    title: s.course,
    extendedProps: { session: s },
  }));

  const weekLabel = t('board.weekTitle', {
    date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(weekStart),
  });

  return (
    <Box>
      <Box
        className="hp-no-print"
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title={t('timetable.previousWeek')}>
            <IconButton aria-label={t('timetable.previousWeek')} onClick={() => setWeekStart((w) => addDays(w, -7))}>
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" size="small" onClick={() => setWeekStart(mondayOf(new Date()))}>
            {t('timetable.thisWeek')}
          </Button>
          <Tooltip title={t('timetable.nextWeek')}>
            <IconButton aria-label={t('timetable.nextWeek')} onClick={() => setWeekStart((w) => addDays(w, 7))}>
              <ChevronRight />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography component="h2" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: { xs: '1.125rem', md: '1.375rem' }, mx: { md: 1 } }}>
          {weekLabel}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9375rem' }}>
          {t('board.sessionsCount', { count: weekSessions.length })}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {!compact && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, value) => value && setMode(value)}
            aria-label={t('timetable.display')}
          >
            <ToggleButton value="grid" aria-label={t('timetable.grid')}>
              <ViewWeek fontSize="small" sx={{ mr: 0.75 }} />
              {t('timetable.grid')}
            </ToggleButton>
            <ToggleButton value="list" aria-label={t('timetable.list')}>
              <TableRows fontSize="small" sx={{ mr: 0.75 }} />
              {t('timetable.list')}
            </ToggleButton>
          </ToggleButtonGroup>
        )}
        <Tooltip title={t('timetable.print')}>
          <IconButton aria-label={t('timetable.print')} onClick={() => window.print()}>
            <Print />
          </IconButton>
        </Tooltip>
        {actions}
      </Box>

      {showList ? (
        <ListeSeancesCarte
          id="semaine-seances"
          title={weekLabel}
          showClock={false}
          sessions={weekSessions}
          columns={columns}
          onSessionClick={setSelected}
          empty={<Typography sx={{ color: 'text.secondary' }}>{t('timetable.emptyWeek')}</Typography>}
        />
      ) : (
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${ds.radius.md}px`,
            boxShadow: (theme) => (theme.palette.mode === 'dark' ? 'none' : ds.shadow.card),
            p: 1,
            // Grille FullCalendar aux couleurs du système
            '& .fc': {
              fontFamily: ds.font.body,
              '--fc-today-bg-color': 'rgba(0, 24, 97, 0.05)',
              '--fc-border-color': ds.colors.border.default,
              '--fc-now-indicator-color': ds.brand.orange,
            },
            '& .fc-theme-standard td, & .fc-theme-standard th, & .fc-theme-standard .fc-scrollgrid': { borderColor: 'divider' },
            '& .fc-col-header-cell-cushion': {
              fontFamily: ds.font.board,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.8125rem',
              color: 'text.secondary',
              textDecoration: 'none',
              py: 1,
            },
            '& .fc-day-today': { bgcolor: 'action.selected' },
            '& .fc-timegrid-slot-label-cushion': { fontFamily: ds.font.board, fontWeight: 600, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' },
            '& .fc-timegrid-slot': { height: '1.6rem' },
            '& .fc-v-event': { bgcolor: 'transparent', border: 'none', boxShadow: 'none' },
            '& .fc-timegrid-event': { borderRadius: `${ds.radius.xs}px`, overflow: 'hidden', cursor: 'pointer' },
            '& .fc-timegrid-event:focus-visible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 1 },
            '& .fc-timegrid-now-indicator-line': { borderColor: ds.brand.orange },
            '& .fc-timegrid-now-indicator-arrow': { borderColor: ds.brand.orange },
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin]}
            initialView="timeGridWeek"
            initialDate={weekStart}
            locales={[frLocale]}
            locale={i18n.language === 'fr' ? 'fr' : 'en-gb'}
            headerToolbar={false}
            firstDay={1}
            hiddenDays={[0]}
            allDaySlot={false}
            slotMinTime="08:30:00"
            slotMaxTime="18:30:00"
            slotDuration="00:30:00"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
            nowIndicator
            height="auto"
            expandRows
            events={events}
            eventClick={(info) => setSelected(info.event.extendedProps.session)}
            eventContent={(info) => <EventCell session={info.event.extendedProps.session} />}
          />
        </Box>
      )}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, fontFamily: ds.font.board, fontWeight: 700, '&::first-letter': { textTransform: 'uppercase' } }}>
              {new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(selected.start)}
              <PastilleEtat status={selected.status} />
            </DialogTitle>
            <DialogContent dividers>
              <DetailSeance session={selected} phase={selected.start <= new Date() && selected.end > new Date() ? 'live' : 'next'} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>{t('common.close')}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
