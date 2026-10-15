import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, IconButton, Stack, TextField, Typography, alpha } from '@mui/material';
import { Add, Close, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { idLibre } from '../outils';
import { ChampLignes } from './ChampsSaisie';

/** Champs de l'éditeur pour l'association, la remise en ordre et la zone sur image. */

export function ChampsAssociation({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  const majPaire = (id, champs) => maj({ ...d, paires: d.paires.map((p) => (p.id === id ? { ...p, ...champs } : p)) });
  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t('studio.question.paires')}
      </Typography>
      {d.paires.map((p, i) => (
        <Stack key={p.id} direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }} aria-hidden>
            {i + 1}
          </Typography>
          <TextField size="small" fullWidth label={t('studio.question.gauche')} value={p.gauche} onChange={(e) => majPaire(p.id, { gauche: e.target.value })} inputProps={{ maxLength: 300 }} />
          <TextField size="small" fullWidth label={t('studio.question.droite')} value={p.droite} onChange={(e) => majPaire(p.id, { droite: e.target.value })} inputProps={{ maxLength: 300 }} />
          <IconButton onClick={() => maj({ ...d, paires: d.paires.filter((x) => x.id !== p.id) })} disabled={d.paires.length <= 2} aria-label={`${t('studio.question.retirer')} ${i + 1}`}>
            <Close />
          </IconButton>
        </Stack>
      ))}
      <Box>
        <Button startIcon={<Add />} onClick={() => maj({ ...d, paires: [...d.paires, { id: idLibre(d.paires, 'p'), gauche: '', droite: '' }] })} disabled={d.paires.length >= 8}>
          {t('studio.question.ajouterPaire')}
        </Button>
      </Box>
      <ChampLignes label={t('studio.question.distracteurs')} valeur={d.distracteurs ?? []} onChange={(distracteurs) => maj({ ...d, distracteurs })} lignes={2} />
    </Stack>
  );
}

export function ChampsOrdre({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  const deplacer = (i, j) => {
    if (j < 0 || j >= d.elements.length) return;
    const elements = [...d.elements];
    [elements[i], elements[j]] = [elements[j], elements[i]];
    maj({ ...d, elements });
  };
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t('studio.question.elements')}
      </Typography>
      {d.elements.map((e, i) => (
        <Stack key={e.id} direction="row" spacing={0.5} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: 20, fontWeight: 700 }} aria-hidden>
            {i + 1}
          </Typography>
          <TextField size="small" fullWidth value={e.texte} label={t('studio.question.element', { n: i + 1 })} onChange={(ev) => maj({ ...d, elements: d.elements.map((x) => (x.id === e.id ? { ...x, texte: ev.target.value } : x)) })} inputProps={{ maxLength: 300 }} />
          <IconButton size="small" onClick={() => deplacer(i, i - 1)} disabled={i === 0} aria-label={`${t('studio.editeur.monter')} ${i + 1}`}>
            <KeyboardArrowUp />
          </IconButton>
          <IconButton size="small" onClick={() => deplacer(i, i + 1)} disabled={i === d.elements.length - 1} aria-label={`${t('studio.editeur.descendre')} ${i + 1}`}>
            <KeyboardArrowDown />
          </IconButton>
          <IconButton size="small" onClick={() => maj({ ...d, elements: d.elements.filter((x) => x.id !== e.id) })} disabled={d.elements.length <= 2} aria-label={`${t('studio.question.retirer')} ${i + 1}`}>
            <Close />
          </IconButton>
        </Stack>
      ))}
      <Box>
        <Button startIcon={<Add />} onClick={() => maj({ ...d, elements: [...d.elements, { id: idLibre(d.elements, 'e'), texte: '' }] })} disabled={d.elements.length >= 8}>
          {t('studio.question.ajouterElement')}
        </Button>
      </Box>
    </Stack>
  );
}

const borne = (v) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;

/** Zones justes : rectangles tracés à la souris (ou saisis en % pour plus de précision). */
export function ChampsZone({ question, maj, srcImage }) {
  const { t } = useTranslation();
  const d = question.donnees;
  const cadre = useRef(null);
  const [trace, setTrace] = useState(null);
  const position = (e) => {
    const r = cadre.current.getBoundingClientRect();
    return { x: borne(((e.clientX - r.left) / r.width) * 100), y: borne(((e.clientY - r.top) / r.height) * 100) };
  };
  const rectangle = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), l: borne(Math.abs(a.x - b.x)), h: borne(Math.abs(a.y - b.y)) });
  const terminer = (e) => {
    if (!trace) return;
    const z = rectangle(trace.depart, position(e));
    setTrace(null);
    if (z.l >= 1 && z.h >= 1 && d.zones.length < 6) maj({ ...d, zones: [...d.zones, z] });
  };
  const majZone = (i, champ, valeur) => maj({ ...d, zones: d.zones.map((z, j) => (j === i ? { ...z, [champ]: Number(valeur) } : z)) });
  if (!srcImage) return <Alert severity="info">{t('studio.question.zonesAide')}</Alert>;
  const encours = trace ? rectangle(trace.depart, trace.courant) : null;
  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        {t('studio.question.zonesAide')}
      </Typography>
      <Box
        ref={cadre}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = position(e);
          setTrace({ depart: p, courant: p });
        }}
        onPointerMove={(e) => trace && setTrace({ ...trace, courant: position(e) })}
        onPointerUp={terminer}
        sx={{ position: 'relative', display: 'inline-block', maxWidth: '100%', cursor: 'crosshair', touchAction: 'none', userSelect: 'none', border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
      >
        <Box component="img" src={srcImage} alt="" draggable={false} sx={{ display: 'block', maxWidth: '100%', maxHeight: 420 }} />
        {[...d.zones, ...(encours ? [encours] : [])].map((z, i) => (
          <Box key={i} sx={{ position: 'absolute', left: `${z.x}%`, top: `${z.y}%`, width: `${z.l}%`, height: `${z.h}%`, border: 2, borderColor: 'success.main', bgcolor: (theme) => alpha(theme.palette.success.main, 0.2), pointerEvents: 'none' }}>
            <Typography variant="caption" sx={{ position: 'absolute', top: 0, left: 2, fontWeight: 700, color: 'success.dark' }}>
              {i + 1}
            </Typography>
          </Box>
        ))}
      </Box>
      {d.zones.map((z, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 20 }}>
            {i + 1}
          </Typography>
          {['x', 'y', 'l', 'h'].map((c) => (
            <TextField key={c} size="small" type="number" label={`${c} %`} value={z[c]} onChange={(e) => majZone(i, c, e.target.value)} inputProps={{ min: 0, max: 100, step: 0.5 }} sx={{ width: 96 }} />
          ))}
          <IconButton onClick={() => maj({ ...d, zones: d.zones.filter((_, j) => j !== i) })} aria-label={`${t('studio.question.retirer')} ${i + 1}`}>
            <Close />
          </IconButton>
        </Stack>
      ))}
      {d.zones.length > 0 && (
        <Box>
          <Button color="error" onClick={() => maj({ ...d, zones: [] })}>
            {t('studio.question.effacerZones')}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
