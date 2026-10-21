import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Print, TableRows, ViewWeek } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { ds } from '../../design-system/tokens';
import { byStart, toBoardSession } from '../../utils/session';
import CarteSeance from './CarteSeance';
import FicheSeance from './FicheSeance';
import ListeSemaine from './ListeSemaine';

/**
 * Emploi du temps hebdomadaire, séances en cartes claires (R-7) :
 * - ordinateur : grille lundi → samedi à échelle horaire fixe (toutes les semaines comparables),
 *   chaque séance en carte haute de sa durée, liseré de la couleur du module ;
 * - téléphone (ou vue liste) : les mêmes cartes, jour par jour.
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

export default function EnhancedTimetable({ affectations = [], actions, columns = ['time', 'course', 'room', 'teacher', 'status'] }) {
  const { t, i18n } = useTranslation();
  const compact = useMediaQuery('(max-width:899.95px)');
  const calendarRef = useRef(null);
  const sessions = useMemo(() => affectations.map(toBoardSession).filter((s) => s.start).sort(byStart), [affectations]);
  // Une alerte de report ouvre la semaine de la nouvelle date : « ?date=AAAA-MM-JJ » (recette du 20 octobre, M-7)
  const [params] = useSearchParams();
  const dateDemandee = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') ?? '') ? new Date(`${params.get('date')}T12:00:00`) : null;
  const [weekStart, setWeekStart] = useState(() => mondayOf(dateDemandee ?? new Date()));
  const [weekResolved, setWeekResolved] = useState(Boolean(dateDemandee));
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
            // Gris par défaut de MUI : 4,49:1 sur le fond de l'application, sous le seuil AA
            sx={{ '& .MuiToggleButton-root:not(.Mui-selected)': { color: 'text.secondary' } }}
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
        <ListeSemaine
          sessions={weekSessions}
          columns={columns}
          onSessionClick={setSelected}
          empty={<Typography sx={{ color: 'text.secondary' }}>{t('timetable.emptyWeek')}</Typography>}
        />
      ) : (
        <Box
          sx={(theme) => ({
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${ds.radius.lg}px`,
            p: 1,
            // Grille FullCalendar aux couleurs du système
            '& .fc': {
              fontFamily: ds.font.body,
              '--fc-today-bg-color': 'rgba(0, 24, 97, 0.05)',
              '--fc-border-color': ds.colors.border.default,
              '--fc-now-indicator-color': ds.brand.orange,
              // Fond des en-têtes de jours : blanc par défaut, illisible en sombre
              '--fc-page-bg-color': theme.palette.background.paper,
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
            '& .fc-timegrid-event': { borderRadius: '3px', overflow: 'hidden', cursor: 'pointer' },
            '& .fc-timegrid-event:focus-visible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 1 },
            '& .fc-timegrid-now-indicator-line': { borderColor: ds.brand.orange },
            '& .fc-timegrid-now-indicator-arrow': { borderColor: ds.brand.orange },
          })}
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
            eventContent={(info) => <CarteSeance session={info.event.extendedProps.session} />}
          />
        </Box>
      )}

      <FicheSeance session={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}
