import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Capitales } from '../../components/jeux/Panneau';
import EcranTerminal from '../../components/jeux/session/EcranTerminal';
import { useToast } from '../../contexts/ToastContext';
import { sessionsJeuAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import { defisLinux } from '../../../../shared/terminal/jeu.js';
import { ecranDuTableau } from '../../../../shared/terminal/tableau.js';

const RAFRAICHIR_MS = 3000;

/**
 * Session collective, côté étudiant (téléphone ou ordinateur) : le défi projeté, le terminal de la
 * classe tel qu'il est au tableau, et la réponse que l'étudiant propose. L'enseignant choisit la
 * réponse jouée ; l'étudiant voit si la sienne a été retenue.
 */
export default function JeuEnDirect() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const langue = i18n.language;
  const defis = useMemo(() => defisLinux(langue), [langue]);
  const [tableau, setTableau] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [saisie, setSaisie] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const monte = useRef(true);

  const charger = useCallback(async () => {
    try {
      const v = await sessionsJeuAPI.tableau(id);
      if (monte.current) {
        setTableau(v);
        setErreur(null);
      }
    } catch (e) {
      if (monte.current) setErreur(e?.message || t('jeux.erreur'));
    }
  }, [id, t]);

  useEffect(() => {
    monte.current = true;
    charger();
    const minuterie = setInterval(() => document.visibilityState === 'visible' && charger(), RAFRAICHIR_MS);
    return () => {
      monte.current = false;
      clearInterval(minuterie);
    };
  }, [charger]);

  const defi = tableau ? defis.find((d) => d.id === tableau.id_defi) : null;
  const ecran = useMemo(() => (defi ? ecranDuTableau(defi.id, tableau.commandes, { langue }) : null), [defi, tableau?.commandes, langue]);
  const ouverte = tableau?.statut === 'ouverte';

  const proposer = async (e) => {
    e.preventDefault();
    const texte = saisie.trim();
    if (!texte) return;
    setEnvoi(true);
    try {
      setTableau(await sessionsJeuAPI.proposer(id, texte));
      setSaisie('');
      toast.success(t('sessionsJeu.direct.envoyee'));
    } catch (err) {
      toast.error(err?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  const mienne = tableau?.ma_proposition;

  return (
    <DashboardLayout>
      <Button component={RouterLink} to="/jeux" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        {t('jeux.tous')}
      </Button>
      {erreur && !tableau && <Alert severity="error">{erreur}</Alert>}
      {!tableau && !erreur && <Skeleton variant="rectangular" height={240} />}
      {tableau && defi && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box component="article" sx={{ border: `1px solid ${ds.colors.border.default}`, borderRadius: `${ds.radius.md}px`, bgcolor: 'background.paper', px: { xs: 2, sm: 3 }, py: 2.5 }}>
            <Capitales sx={{ fontSize: '0.75rem', letterSpacing: '0.14em', color: 'text.secondary' }}>
              {tableau.module ? `${tableau.module.code} · ` : ''}{t('sessionsJeu.modes.collectif.nom')}
            </Capitales>
            <Typography variant="h1" component="h1" sx={{ mt: 0.5, mb: 1 }}>{defi.titre}</Typography>
            <Typography>{defi.objectif}</Typography>
            {tableau.reussi && <Alert severity="success" sx={{ mt: 2 }}>{t('sessionsJeu.collectif.reussi')}</Alert>}
            {!ouverte && <Alert severity="info" sx={{ mt: 2 }}>{t('sessionsJeu.terminee')}</Alert>}
          </Box>

          {ouverte && (
            <Box component="form" onSubmit={proposer} sx={{ border: `1px solid ${ds.colors.border.default}`, borderRadius: `${ds.radius.md}px`, bgcolor: 'background.paper', p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label={t('sessionsJeu.direct.votreReponse')}
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  fullWidth
                  autoComplete="off"
                  inputProps={{ maxLength: 300, autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false, style: { fontFamily: ds.font.mono } }}
                />
                <Button type="submit" variant="contained" startIcon={<Send />} disabled={envoi || !saisie.trim()} sx={{ minHeight: 48, flexShrink: 0 }}>
                  {t('sessionsJeu.direct.envoyer')}
                </Button>
              </Stack>
              {mienne && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }} aria-live="polite">
                  {t(`sessionsJeu.direct.statuts.${mienne.statut}`)} <Box component="code" sx={{ fontFamily: ds.font.mono }}>{mienne.texte}</Box>
                </Typography>
              )}
            </Box>
          )}

          <EcranTerminal ecran={ecran} titre={t('sessionsJeu.collectif.terminal')} hauteur={300} />
        </Box>
      )}
    </DashboardLayout>
  );
}
