import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Drawer, IconButton, InputAdornment, TextField, Tooltip, Typography } from '@mui/material';
import { ArrowForward, Close, ExpandMore, HelpOutline, Search } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { estResponsable } from '../../utils/droits';
import { THEMES, concernePage, correspond, fichesPour } from './fiches';

/**
 * Bouton d'aide de la barre du haut (lot G-1) : un panneau de fiches « comment faire » propres au
 * rôle connecté. Les fiches de la page ouverte viennent en premier, la première déjà dépliée ;
 * une recherche filtre toutes les fiches ; « Y aller » ouvre la page où agir.
 * @param {{ aller: (chemin: string) => void }} props navigation de la mise en page (gère aussi /biblio)
 */
export default function Aide({ aller }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [depliee, setDepliee] = useState(null);

  const fiches = useMemo(
    () =>
      fichesPour(user?.role, estResponsable(user)).map((f) => {
        const etapes = t(`aide.fiches.${f.id}.etapes`, { returnObjects: true });
        const note = t(`aide.fiches.${f.id}.note`, { defaultValue: '' });
        const titre = t(`aide.fiches.${f.id}.titre`);
        return { ...f, titre, etapes: Array.isArray(etapes) ? etapes : [], note, texte: [titre, ...(Array.isArray(etapes) ? etapes : []), note].join(' ') };
      }),
    [user, t]
  );

  const filtrees = recherche.trim() ? fiches.filter((f) => correspond(f.texte, recherche)) : fiches;
  const ici = recherche.trim() ? [] : filtrees.filter((f) => concernePage(f, location.pathname));
  const autres = filtrees.filter((f) => !ici.includes(f));
  const groupes = [
    ...(ici.length ? [{ cle: 'ici', titre: t('aide.surCettePage'), fiches: ici }] : []),
    ...THEMES.map((theme) => ({ cle: theme, titre: t(`aide.themes.${theme}`), fiches: autres.filter((f) => f.theme === theme) })).filter((g) => g.fiches.length),
  ];
  // Sans choix de l'utilisateur, la première fiche de la page est dépliée
  const ouverteParDefaut = ici[0]?.id ?? null;
  const estDepliee = (f) => (depliee === null ? f.id === ouverteParDefaut : depliee === f.id);

  const ouvrir = () => {
    setRecherche('');
    setDepliee(null);
    setOuvert(true);
  };
  const yAller = (f) => {
    setOuvert(false);
    aller(f.lien);
  };

  if (!fiches.length) return null;

  return (
    <>
      <Tooltip title={t('aide.titre')}>
        <IconButton onClick={ouvrir} aria-label={t('aide.titre')} sx={{ color: 'inherit' }}>
          <HelpOutline />
        </IconButton>
      </Tooltip>
      <Drawer anchor="right" open={ouvert} onClose={() => setOuvert(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } }, 'aria-labelledby': 'aide-titre' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2, pb: 1 }}>
          <Typography id="aide-titre" component="h2" variant="h6" sx={{ flexGrow: 1 }}>
            {t('aide.titre')}
          </Typography>
          <IconButton onClick={() => setOuvert(false)} aria-label={t('common.close')}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <TextField
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setDepliee(null);
            }}
            placeholder={t('aide.rechercher')}
            size="small"
            fullWidth
            autoFocus
            inputProps={{ 'aria-label': t('aide.rechercher') }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, pb: 2 }}>
          {groupes.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 3 }} role="status">
              {t('aide.aucune')}
            </Typography>
          )}
          {groupes.map((groupe) => (
            <Box key={groupe.cle} component="section" aria-label={groupe.titre} sx={{ mb: 2 }}>
              <Typography component="h3" variant="overline" color={groupe.cle === 'ici' ? 'primary' : 'text.secondary'} sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.1em' }}>
                {groupe.titre}
              </Typography>
              {groupe.fiches.map((f) => (
                <Accordion
                  key={f.id}
                  disableGutters
                  variant="outlined"
                  expanded={estDepliee(f)}
                  onChange={(_, ouverte) => setDepliee(ouverte ? f.id : '')}
                  sx={{ '&:not(:last-of-type)': { mb: 1 }, '&::before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`aide-${f.id}-contenu`} id={`aide-${f.id}-titre`}>
                    <Typography sx={{ fontWeight: 600 }}>{f.titre}</Typography>
                  </AccordionSummary>
                  <AccordionDetails id={`aide-${f.id}-contenu`} sx={{ pt: 0 }}>
                    <Box component="ol" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 0.75 }}>
                      {f.etapes.map((etape) => (
                        <Typography key={etape} component="li" variant="body2">
                          {etape}
                        </Typography>
                      ))}
                    </Box>
                    {f.note && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
                        {f.note}
                      </Typography>
                    )}
                    {f.lien && location.pathname !== f.lien && (
                      <Button size="small" variant="outlined" endIcon={<ArrowForward />} onClick={() => yAller(f)} sx={{ mt: 1.5 }}>
                        {t('aide.yAller')}
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Box>

        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {t(`aide.contact.${user?.role === 'admin' ? 'admin' : user?.role === 'enseignant' ? 'enseignant' : 'etudiant'}`)}
          </Typography>
        </Box>
      </Drawer>
    </>
  );
}
