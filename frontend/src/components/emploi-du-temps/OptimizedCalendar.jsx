/**
 * OptimizedCalendar.jsx
 * Wrapper FullCalendar optimisé — isole les re-renders et optimise les props.
 *
 * Problèmes FullCalendar sans optimisation :
 *   1. Re-render sur chaque changement d'état parent → jank
 *   2. Réinitialisation complète si events change de référence
 *   3. Callbacks recreés → FullCalendar re-render inutile
 *   4. Pas de loading state pendant le fetch initial
 *
 * Solutions appliquées :
 *   1. React.memo avec comparaison personnalisée
 *   2. useMemo sur events (même données = même référence)
 *   3. useCallback sur tous les handlers
 *   4. Skeleton pendant le chargement initial
 *   5. ErrorBoundary local (FullCalendar peut crasher sur données malformées)
 */

import { memo, useMemo, useCallback, useRef } from 'react';
import { Box, Skeleton, Typography, Alert } from '@mui/material';
import ErrorBoundary from '../common/ErrorBoundary';

// FullCalendar — import statique car ce composant est DÉJÀ dans le chunk calendar
// (Le chunk est chargé lazy uniquement depuis les pages emploi-du-temps)
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin    from '@fullcalendar/daygrid';
import timeGridPlugin   from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

// ── Comparateur de props pour React.memo ──────────────────────────────────
function arePropsEqual(prev, next) {
  // Comparer les events par référence d'abord, puis par count
  if (prev.events === next.events) return true;
  if (prev.events?.length !== next.events?.length) return false;
  // Comparaison superficielle (pas deep) pour performance
  return prev.events?.every((e, i) => e.id === next.events?.[i]?.id);
}

// ── Skeleton calendrier ───────────────────────────────────────────────────
function CalendarSkeleton() {
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={200} height={36} sx={{ borderRadius: 1 }} />
        <Box sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 0.5 }} />
        ))}
      </Box>
    </Box>
  );
}

// ── Composant principal mémoïsé ───────────────────────────────────────────
/**
 * @param {{
 *   events: Array<{ id: string, title: string, start: string, end?: string, extendedProps?: object }>,
 *   isLoading?: boolean,
 *   view?: string,
 *   onViewChange?: (view: string) => void,
 *   onEventClick?: (info: object) => void,
 *   onDateClick?: (info: object) => void,
 *   initialDate?: string,
 *   height?: number | 'auto',
 * }} props
 */
const OptimizedCalendar = memo(function OptimizedCalendar({
  events,
  isLoading = false,
  view = 'timeGridWeek',
  onViewChange,
  onEventClick,
  onDateClick,
  initialDate,
  height = 650,
}) {
  const calendarRef = useRef(null);

  // ── Mémoïser les events — FullCalendar ne re-render que si référence change
  const memoEvents = useMemo(() => events ?? [], [events]);

  // ── Stabiliser tous les callbacks ──────────────────────────────────────
  const handleEventClick = useCallback((info) => {
    onEventClick?.(info);
  }, [onEventClick]);

  const handleDateClick = useCallback((info) => {
    onDateClick?.(info);
  }, [onDateClick]);

  const handleViewChange = useCallback((info) => {
    onViewChange?.(info.view.type);
  }, [onViewChange]);

  // ── Options FullCalendar mémoïsées ─────────────────────────────────────
  const plugins = useMemo(
    () => [dayGridPlugin, timeGridPlugin, interactionPlugin],
    [],
  );

  const headerToolbar = useMemo(() => ({
    left:   'prev,next today',
    center: 'title',
    right:  'dayGridMonth,timeGridWeek,timeGridDay',
  }), []);

  const slotMinTime = '08:00:00';
  const slotMaxTime = '20:00:00';

  if (isLoading) return <CalendarSkeleton />;

  return (
    <ErrorBoundary
      fullPage={false}
      fallback={({ reset }) => (
        <Alert severity="error" action={
          <button onClick={reset}>Réessayer</button>
        }>
          Erreur lors du chargement du calendrier.
        </Alert>
      )}
    >
      <Box sx={{
        '.fc': { fontFamily: 'inherit' },
        '.fc-event': { cursor: 'pointer', borderRadius: '4px', border: 'none' },
        '.fc-event:hover': { filter: 'brightness(0.9)' },
        '.fc-button': { textTransform: 'none', fontWeight: 600 },
        '.fc-button-primary': { bgcolor: 'primary.main' },
      }}>
        <FullCalendar
          ref={calendarRef}
          plugins={plugins}
          initialView={view}
          initialDate={initialDate}
          locale={frLocale}
          events={memoEvents}
          headerToolbar={headerToolbar}
          height={height}
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          allDaySlot={false}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleViewChange}
          // Performance : limiter les animations
          eventMaxStack={3}
          moreLinkClick="popover"
          // Accessibility
          navLinks
          nowIndicator
          weekends={true}
          // Optimisation : ne pas re-render si les données n'ont pas changé
          lazyFetching={false}
        />
      </Box>
    </ErrorBoundary>
  );
}, arePropsEqual);

export default OptimizedCalendar;
