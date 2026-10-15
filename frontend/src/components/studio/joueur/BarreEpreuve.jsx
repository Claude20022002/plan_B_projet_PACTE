import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppBar, Box, Button, Chip, LinearProgress, Toolbar, Typography } from '@mui/material';
import { CloudDone, CloudOff, GridView, Sync, Timer } from '@mui/icons-material';

/**
 * Barre du haut de l'épreuve : titre, avancement, temps restant, état de l'enregistrement et
 * accès à la vue d'ensemble. Le temps n'est annoncé aux lecteurs d'écran qu'aux paliers (5 et
 * 1 minute), pas à chaque seconde.
 */

const horloge = (ms) => {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

function Chrono({ restant }) {
  const { t } = useTranslation();
  const [annonce, setAnnonce] = useState('');
  const paliers = useRef(new Set());
  useEffect(() => {
    for (const minutes of [5, 1]) {
      // Annoncé au passage du palier seulement (pas à l'ouverture d'un quiz déjà plus court)
      if (restant <= minutes * 60000 && restant > minutes * 60000 - 10000 && !paliers.current.has(minutes)) {
        paliers.current.add(minutes);
        setAnnonce(t('studio.joueur.tempsAlerte', { n: minutes }));
      }
    }
  }, [restant, t]);
  const couleur = restant <= 60000 ? 'error' : restant <= 5 * 60000 ? 'warning' : 'default';
  return (
    <>
      <Chip
        icon={<Timer />}
        color={couleur}
        variant={couleur === 'default' ? 'outlined' : 'filled'}
        label={horloge(restant)}
        title={t('studio.joueur.tempsRestant')}
        aria-label={`${t('studio.joueur.tempsRestant')} ${horloge(restant)}`}
        sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, minWidth: 92 }}
      />
      <Box aria-live="assertive" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {annonce}
      </Box>
    </>
  );
}

function EtatEnregistrement({ etat }) {
  const { t } = useTranslation();
  const icones = { ok: <CloudDone fontSize="small" />, en_cours: <Sync fontSize="small" />, erreur: <CloudOff fontSize="small" /> };
  const textes = { ok: t('studio.joueur.enregistre'), en_cours: t('studio.joueur.enregistrement'), erreur: t('studio.joueur.horsLigne') };
  return (
    <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: etat === 'erreur' ? 'error.main' : 'text.secondary', minWidth: 0 }}>
      {icones[etat]}
      <Typography variant="caption" sx={{ display: { xs: etat === 'erreur' ? 'block' : 'none', sm: 'block' }, whiteSpace: 'nowrap' }}>
        {textes[etat]}
      </Typography>
    </Box>
  );
}

export default function BarreEpreuve({ titre, index, total, repondues, restant, enregistrement, onVueEnsemble }) {
  const { t } = useTranslation();
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" component="h1" noWrap sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {titre}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('studio.joueur.question', { n: index + 1, total })}
          </Typography>
        </Box>
        <EtatEnregistrement etat={enregistrement} />
        {restant !== null && <Chrono restant={restant} />}
        <Button variant="outlined" startIcon={<GridView />} onClick={onVueEnsemble} sx={{ whiteSpace: 'nowrap', minHeight: 40 }} aria-haspopup="dialog">
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {t('studio.joueur.vueEnsemble')}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            {repondues}/{total}
          </Box>
        </Button>
      </Toolbar>
      <LinearProgress variant="determinate" value={total ? (repondues / total) * 100 : 0} aria-label={`${repondues} / ${total}`} sx={{ height: 3 }} />
    </AppBar>
  );
}
