import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds, lineColor } from '../tokens';
import PastilleEtat from './PastilleEtat';

/**
 * Une séance dans la liste d'une carte (DESIGN.md, Liste des séances) : heure, carré de filière,
 * cours, groupe, salle, enseignant, pastille d'état. Sur téléphone (`compact`), groupe et
 * enseignant passent sous le nom du cours. Séance annulée : grisée, cours barré.
 */

const chiffres = { fontFamily: ds.font.board, fontWeight: 700, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' };

function Cours({ s, colonnes, compact, annulee }) {
  const sousLigne = compact
    ? [colonnes.includes('group') ? s.group : null, colonnes.includes('teacher') ? s.teacher : null]
    : [colonnes.includes('group') ? null : s.group, colonnes.includes('teacher') ? null : s.teacher];
  const details = sousLigne.filter(Boolean).join(' · ');
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box component="span" aria-hidden="true" sx={{ width: 10, height: 10, flexShrink: 0, borderRadius: '3px', bgcolor: lineColor(s.lineKey) }} />
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: compact ? '0.9375rem' : '1rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            // Téléphone : trois lignes au plus, mots entiers ; ordinateur : une ligne
            ...(compact
              ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }
              : { whiteSpace: 'nowrap', textOverflow: 'ellipsis' }),
            color: annulee ? 'text.secondary' : 'text.primary',
            textDecoration: annulee ? 'line-through' : 'none',
            textDecorationColor: ds.status.annule.bureau,
          }}
        >
          {s.course}
        </Box>
      </Box>
      {details && (
        <Box sx={{ mt: 0.25, pl: '18px', fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.4, ...(compact ? {} : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>
          {details}
        </Box>
      )}
    </Box>
  );
}

/** Contenu de la cellule `colonne` pour la séance `s`. */
export function CelluleSeance({ colonne, s, colonnes, compact, phase }) {
  const { t } = useTranslation();
  const annulee = s.status === 'annule';
  switch (colonne) {
    case 'time':
      return (
        <Box>
          <Box component="span" sx={{ ...chiffres, fontSize: compact ? '1rem' : '1.125rem', color: annulee ? 'text.secondary' : 'text.primary' }}>
            {s.startLabel}
          </Box>
          {s.previousLabel && (
            <Box component="del" sx={{ display: 'block', mt: 0.25, fontSize: '0.75rem', color: 'text.secondary' }}>
              {t('board.previously', { value: s.previousLabel })}
            </Box>
          )}
        </Box>
      );
    case 'course':
      return <Cours s={s} colonnes={colonnes} compact={compact} annulee={annulee} />;
    case 'room':
      return (
        <Box sx={{ lineHeight: 1.25 }}>
          <Box component="span" sx={{ ...chiffres, fontSize: compact ? '0.9375rem' : '1.0625rem', color: annulee ? 'text.secondary' : 'text.primary', wordBreak: 'keep-all' }}>
            {s.room || '-'}
          </Box>
          {s.building && <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{s.building}</Box>}
        </Box>
      );
    case 'group':
      return <Box sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>{s.group}</Box>;
    case 'teacher':
      return <Box sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.teacher}</Box>;
    case 'status':
      return (
        <Box sx={{ textAlign: 'right' }}>
          <PastilleEtat status={s.status} phase={phase} />
        </Box>
      );
    default:
      return null;
  }
}
