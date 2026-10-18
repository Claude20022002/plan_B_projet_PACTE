import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { sessionsJeuAPI } from '../../services/api';

/**
 * Arrivée par le QR code d'une session de jeu (/jeux/session/<code>, retour ici après la connexion)
 * ou par le code saisi dans « Activités ». En mode individuel, l'étudiant arrive dans le jeu ; en
 * mode collectif, sur le tableau de la classe, où il envoie ses réponses.
 */
export default function RejoindreJeu() {
  const { code } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [erreur, setErreur] = useState(null);
  const envoye = useRef(false);

  useEffect(() => {
    // Un seul envoi, même si React monte l'écran deux fois en développement
    if (envoye.current) return;
    envoye.current = true;
    sessionsJeuAPI
      .rejoindre(code)
      .then((s) => navigate(s.mode === 'collectif' ? `/jeux/direct/${s.id_session_jeu}` : `/jeux/${s.code_jeu}`, { replace: true }))
      .catch((e) => setErreur(e?.message || t('jeux.erreur')));
  }, [code, navigate, t]);

  return (
    <DashboardLayout>
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240, gap: 2 }}>
        {erreur ? (
          <>
            <Alert severity="warning">{erreur}</Alert>
            <Button component={RouterLink} to="/jeux" variant="contained">{t('jeux.tous')}</Button>
          </>
        ) : (
          <CircularProgress aria-label={t('sessionsJeu.rejoindre.enCours')} />
        )}
      </Box>
    </DashboardLayout>
  );
}
