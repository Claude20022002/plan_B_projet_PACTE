import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import { ArrowBack, Stop } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CodeAcces from '../../components/studio/editeur/CodeAcces';
import SuiviIndividuel from '../../components/jeux/session/SuiviIndividuel';
import TableauCollectif from '../../components/jeux/session/TableauCollectif';
import { useToast } from '../../contexts/ToastContext';
import { sessionsJeuAPI } from '../../services/api';
import { jeuParCode, libelle } from '../../../../shared/jeux/catalogue.js';

// Les étudiants rejoignent et répondent au fil de la séance : relecture toutes les 3 s
const RAFRAICHIR_MS = 3000;

/** Adresse qu'ouvre le QR code d'une session (le téléphone de l'étudiant arrive dans le jeu). */
const lienSession = (code) => `${window.location.origin}/jeux/session/${code}`;

/**
 * Session de jeu lancée par l'enseignant, à projeter : le QR code et le code pour la rejoindre,
 * puis le suivi des étudiants (mode individuel) ou le tableau joué avec la classe (mode collectif).
 */
export default function SessionJeu() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [terminer, setTerminer] = useState(false);
  const monte = useRef(true);

  const charger = useCallback(async () => {
    try {
      const s = await sessionsJeuAPI.suivi(id);
      if (monte.current) {
        setSession(s);
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

  const confirmerFin = async () => {
    setTerminer(false);
    try {
      await sessionsJeuAPI.terminer(id);
      toast.success(t('sessionsJeu.termineeOk'));
      charger();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  const titre = session ? libelle(jeuParCode(session.code_jeu)?.titre, i18n.language) : '';
  const ouverte = session?.statut === 'ouverte';

  return (
    <DashboardLayout>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Button component={RouterLink} to="/jeux" startIcon={<ArrowBack />} sx={{ alignSelf: 'flex-start' }}>
          {t('jeux.tous')}
        </Button>
        {ouverte && (
          <Button color="error" variant="outlined" startIcon={<Stop />} onClick={() => setTerminer(true)}>
            {t('sessionsJeu.terminer')}
          </Button>
        )}
      </Stack>

      {erreur && !session && <Alert severity="error">{erreur}</Alert>}
      {!session && !erreur && <Skeleton variant="rectangular" height={240} />}

      {session && (
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          <Box>
            <Typography variant="h1" component="h1">{titre}</Typography>
            <Typography color="text.secondary">
              {[session.module ? `${session.module.code} · ${session.module.nom}` : null, t(`sessionsJeu.modes.${session.mode}.nom`), ouverte ? null : t('sessionsJeu.terminee')].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          {ouverte && (
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', p: { xs: 2, sm: 3 } }}>
              <CodeAcces code={session.code} titre={titre} lien={lienSession(session.code)} page="/jeux" aide={t(`sessionsJeu.modes.${session.mode}.aide`)} libelle={t('sessionsJeu.code')} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('sessionsJeu.participants', { count: session.participants.length })}
              </Typography>
            </Box>
          )}
          {session.mode === 'collectif' ? <TableauCollectif session={session} onMaj={charger} /> : <SuiviIndividuel session={session} />}
        </Box>
      )}

      <ConfirmDialog
        open={terminer}
        title={t('sessionsJeu.terminerTitre')}
        message={t('sessionsJeu.terminerTexte')}
        confirmLabel={t('sessionsJeu.terminer')}
        onConfirm={confirmerFin}
        onCancel={() => setTerminer(false)}
      />
    </DashboardLayout>
  );
}
