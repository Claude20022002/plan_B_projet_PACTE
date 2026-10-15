import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { Add, AutoAwesome, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { IconeType } from '../typesQuestion';
import { TYPES_ORDONNES } from '../outils';

/**
 * Plan du quiz : une ligne par question (numéro, type, début de l'énoncé, points, « à relire »),
 * flèches pour réordonner, ajout d'une question par type ou génération par l'IA.
 */
export default function ListeQuestions({ questions, selection, onSelection, onDeplacer, onAjouter, onGenerer, iaDisponible }) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(null);
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', position: { md: 'sticky' }, top: { md: 88 } }}>
      {questions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          {t('studio.editeur.aucuneQuestion')}
        </Typography>
      ) : (
        <List dense disablePadding sx={{ maxHeight: { md: 'calc(100vh - 260px)' }, overflow: 'auto' }} aria-label={t('studio.editeur.onglets.questions')}>
          {questions.map((q, i) => (
            <ListItemButton
              key={q.id_question}
              selected={q.id_question === selection}
              onClick={() => onSelection(q.id_question)}
              aria-current={q.id_question === selection ? 'true' : undefined}
              divider
              sx={{ alignItems: 'flex-start', gap: 1, py: 1, pr: 0.5, borderLeft: 3, borderLeftColor: q.a_relire ? 'warning.main' : 'transparent' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 22, pt: 0.25 }}>
                {i + 1}
              </Typography>
              <ListItemIcon sx={{ minWidth: 0, pt: 0.25 }}>
                <IconeType type={q.type} fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={q.enonce || '…'}
                secondary={`${t(`studio.types.${q.type}.nom`)} · ${t('studio.banque.points', { count: q.points })}${q.a_relire ? ` · ${t('studio.editeur.aRelire')}` : ''}`}
                primaryTypographyProps={{ sx: { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' } }}
                secondaryTypographyProps={{ sx: { color: q.a_relire ? 'warning.main' : undefined } }}
              />
              <Stack onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" onClick={() => onDeplacer(i, i - 1)} disabled={i === 0} aria-label={`${t('studio.editeur.monter')} ${i + 1}`}>
                  <KeyboardArrowUp fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDeplacer(i, i + 1)} disabled={i === questions.length - 1} aria-label={`${t('studio.editeur.descendre')} ${i + 1}`}>
                  <KeyboardArrowDown fontSize="small" />
                </IconButton>
              </Stack>
            </ListItemButton>
          ))}
        </List>
      )}
      <Box sx={{ p: 1.5, display: 'grid', gap: 1, borderTop: questions.length ? 1 : 0, borderColor: 'divider' }}>
        <Button variant="outlined" startIcon={<Add />} onClick={(e) => setMenu(e.currentTarget)} aria-haspopup="menu" fullWidth>
          {t('studio.editeur.ajouter')}
        </Button>
        {iaDisponible && (
          <Button startIcon={<AutoAwesome />} onClick={onGenerer} fullWidth>
            {t('studio.editeur.generer')}
          </Button>
        )}
      </Box>
      <Menu anchorEl={menu} open={Boolean(menu)} onClose={() => setMenu(null)} MenuListProps={{ 'aria-label': t('studio.editeur.choisirType') }} PaperProps={{ sx: { maxWidth: 380 } }}>
        {TYPES_ORDONNES.map((type) => (
          <MenuItem
            key={type}
            onClick={() => {
              setMenu(null);
              onAjouter(type);
            }}
            sx={{ alignItems: 'flex-start', gap: 1.5, py: 1, whiteSpace: 'normal' }}
          >
            <IconeType type={type} color="primary" sx={{ mt: 0.25 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t(`studio.types.${type}.nom`)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t(`studio.types.${type}.aide`)}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
