import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, MenuItem, Paper, Stack, TextField, Typography, alpha } from '@mui/material';
import { CancelOutlined, CheckCircleOutline, DragIndicator, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';

/**
 * Réponses interactives : association (une liste déroulante par élément, utilisable au clavier et
 * au téléphone, là où le glisser-déposer ne l'est pas), remise en ordre (glisser-déposer à la
 * souris, flèches sinon), zone sur une image (clic, toucher, ou flèches pour déplacer le repère).
 */

const IconeEtat = ({ juste }) => (juste === null ? null : juste ? <CheckCircleOutline color="success" fontSize="small" aria-hidden /> : <CancelOutlined color="error" fontSize="small" aria-hidden />);

export function ReponseAssociation({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const choix = valeur && typeof valeur === 'object' ? valeur : {};
  const bonnes = correction?.bonne_reponse ?? null;
  const texteDroite = (id) => question.droites.find((d) => d.id === id)?.texte;
  const choisir = (gauche, droite) => {
    const suivants = { ...choix, [gauche]: droite };
    if (!droite) delete suivants[gauche];
    onChange(Object.keys(suivants).length ? suivants : null);
  };
  return (
    <Stack spacing={1}>
      {question.gauches.map((g) => {
        const juste = bonnes ? choix[g.id] === bonnes[g.id] : null;
        const prises = new Set(Object.entries(choix).filter(([cle]) => cle !== g.id).map(([, v]) => v));
        return (
          <Paper key={g.id} variant="outlined" sx={{ p: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, alignItems: 'center', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }} id={`gauche-${g.id}`}>
              {g.texte}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                fullWidth
                size="small"
                value={choix[g.id] ?? ''}
                onChange={(e) => choisir(g.id, e.target.value)}
                disabled={desactive}
                color={juste === null ? undefined : juste ? 'success' : 'error'}
                focused={juste !== null || undefined}
                SelectProps={{ displayEmpty: true, inputProps: { 'aria-labelledby': `gauche-${g.id}` } }}
              >
                <MenuItem value="">
                  <em>{t('studio.joueur.associer')}</em>
                </MenuItem>
                {question.droites.map((d) => (
                  <MenuItem key={d.id} value={d.id} disabled={prises.has(d.id)}>
                    {d.texte}
                  </MenuItem>
                ))}
              </TextField>
              <IconeEtat juste={juste} />
            </Stack>
            {bonnes && !juste && (
              <Typography variant="caption" sx={{ gridColumn: '1 / -1', color: 'success.main', fontWeight: 600 }}>
                {t('studio.joueur.bonneReponse')} : {texteDroite(bonnes[g.id])}
              </Typography>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}

export function ReponseOrdre({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const [glisse, setGlisse] = useState(null);
  const parId = new Map(question.elements.map((e) => [e.id, e]));
  const ordre = Array.isArray(valeur) && valeur.length === question.elements.length ? valeur : question.elements.map((e) => e.id);
  const bonnes = correction?.bonne_reponse ?? null;
  const deplacer = (de, vers) => {
    if (vers < 0 || vers >= ordre.length || de === vers) return;
    const suivant = [...ordre];
    const [element] = suivant.splice(de, 1);
    suivant.splice(vers, 0, element);
    onChange(suivant);
  };
  return (
    <Box>
      {!desactive && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('studio.joueur.ordreAide')}
        </Typography>
      )}
      <Stack component="ol" spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {ordre.map((id, i) => {
          const juste = bonnes ? bonnes[i] === id : null;
          return (
            <Paper
              component="li"
              key={id}
              variant="outlined"
              draggable={!desactive}
              onDragStart={() => setGlisse(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                deplacer(glisse, i);
                setGlisse(null);
              }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, pl: 1.5, minHeight: 52, borderRadius: 2, borderWidth: 2, borderColor: juste === null ? (glisse === i ? 'primary.main' : 'divider') : juste ? 'success.main' : 'error.main', cursor: desactive ? 'default' : 'grab', opacity: glisse === i ? 0.6 : 1 }}
            >
              {!desactive && <DragIndicator color="action" aria-hidden />}
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, fontWeight: 700 }} aria-hidden>
                {i + 1}
              </Typography>
              <Typography variant="body1" sx={{ flex: 1, overflowWrap: 'anywhere' }}>
                {parId.get(id)?.texte}
              </Typography>
              <IconeEtat juste={juste} />
              {!desactive && (
                <>
                  <IconButton size="small" onClick={() => deplacer(i, i - 1)} disabled={i === 0} aria-label={`${t('studio.editeur.monter')} : ${parId.get(id)?.texte}`}>
                    <KeyboardArrowUp />
                  </IconButton>
                  <IconButton size="small" onClick={() => deplacer(i, i + 1)} disabled={i === ordre.length - 1} aria-label={`${t('studio.editeur.descendre')} : ${parId.get(id)?.texte}`}>
                    <KeyboardArrowDown />
                  </IconButton>
                </>
              )}
            </Paper>
          );
        })}
      </Stack>
      {bonnes && correction?.statut !== 'juste' && (
        <Typography variant="body2" sx={{ mt: 1, color: 'success.main', fontWeight: 600 }}>
          {t('studio.joueur.bonneReponse')} : {bonnes.map((id) => parId.get(id)?.texte).join(' → ')}
        </Typography>
      )}
    </Box>
  );
}

/** Zones justes (en % de l'image) dessinées en correction ; repère de l'étudiant en cercle. */
export function ReponseZone({ question, valeur, onChange, desactive, correction, src, description }) {
  const { t } = useTranslation();
  const cadre = useRef(null);
  const point = valeur && Number.isFinite(Number(valeur.x)) ? { x: Number(valeur.x), y: Number(valeur.y) } : null;
  const zones = correction?.bonne_reponse?.zones ?? [];
  const placer = (x, y) => onChange({ x: Math.round(Math.min(100, Math.max(0, x)) * 10) / 10, y: Math.round(Math.min(100, Math.max(0, y)) * 10) / 10 });
  const cliquer = (e) => {
    if (desactive) return;
    const r = cadre.current.getBoundingClientRect();
    placer(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };
  const clavier = (e) => {
    if (desactive) return;
    const pas = e.shiftKey ? 10 : 2;
    const base = point ?? { x: 50, y: 50 };
    const deltas = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas] };
    if (deltas[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      placer(base.x + deltas[e.key][0], base.y + deltas[e.key][1]);
    } else if ((e.key === 'Enter' || e.key === ' ') && !point) {
      e.preventDefault();
      placer(50, 50);
    }
  };
  return (
    <Box>
      {!desactive && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('studio.joueur.zoneAide')}
        </Typography>
      )}
      <Box
        ref={cadre}
        role="application"
        tabIndex={desactive ? -1 : 0}
        aria-label={`${description || question.enonce}. ${point ? t('studio.joueur.zoneChoisie', { x: point.x, y: point.y }) : ''}`}
        onClick={cliquer}
        onKeyDown={clavier}
        sx={{ position: 'relative', display: 'inline-block', maxWidth: '100%', cursor: desactive ? 'default' : 'crosshair', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
      >
        <Box component="img" src={src} alt="" draggable={false} sx={{ display: 'block', maxWidth: '100%', maxHeight: { xs: 320, md: 480 }, userSelect: 'none' }} />
        {zones.map((z, i) => (
          <Box key={i} aria-hidden sx={{ position: 'absolute', left: `${z.x}%`, top: `${z.y}%`, width: `${z.l}%`, height: `${z.h}%`, border: 3, borderColor: 'success.main', borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.success.main, 0.15) }} />
        ))}
        {point && (
          <Box aria-hidden sx={{ position: 'absolute', left: `${point.x}%`, top: `${point.y}%`, width: 22, height: 22, ml: '-11px', mt: '-11px', borderRadius: '50%', border: 3, borderColor: correction ? (correction.statut === 'juste' ? 'success.main' : 'error.main') : 'primary.main', bgcolor: 'background.paper', boxShadow: 2 }} />
        )}
      </Box>
    </Box>
  );
}
