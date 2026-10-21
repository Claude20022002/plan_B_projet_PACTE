import { Box, ButtonBase, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../../design-system/tokens';
import { formatDayLabel, groupByDay, toLocalISODate } from '../../utils/session';
import CarteSeance from './CarteSeance';

/**
 * La semaine en liste (téléphone, ou « Liste » sur ordinateur) : un bandeau par jour, puis les
 * séances du jour en cartes claires. Chaque carte est un bouton qui ouvre la fiche de la séance.
 */

const sxJour = (aujourdhui) => ({
  fontFamily: ds.font.board,
  fontWeight: 700,
  fontSize: '0.8125rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: aujourdhui ? 'primary.main' : 'text.secondary',
  mb: 1,
});

/** Rend la liste de la semaine, ou empty s'il n'y a aucune séance. */
export default function ListeSemaine({ sessions, columns, onSessionClick, empty }) {
  const { t, i18n } = useTranslation();
  const aujourdhui = toLocalISODate();
  const demain = toLocalISODate(new Date(Date.now() + 86400000));

  if (sessions.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.md}px`, bgcolor: 'background.paper' }}>
        {empty}
      </Box>
    );
  }

  const libelleJour = (date) => {
    const jour = formatDayLabel(date, i18n.language);
    if (date === aujourdhui) return `${t('common.today')} · ${jour}`;
    if (date === demain) return `${t('common.tomorrow')} · ${jour}`;
    return jour;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {groupByDay(sessions).map(({ date, items }) => (
        <Box component="section" key={date} aria-labelledby={`jour-${date}`}>
          <Typography id={`jour-${date}`} component="h3" sx={sxJour(date === aujourdhui)}>
            {libelleJour(date)}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {items.map((s) => (
              <Box component="li" key={s.id}>
                <ButtonBase
                  onClick={() => onSessionClick?.(s)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: `${ds.radius.sm}px`,
                    bgcolor: 'background.paper',
                    '&:focus-visible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 2 },
                  }}
                >
                  <CarteSeance session={s} variante="liste" columns={columns} />
                </ButtonBase>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
