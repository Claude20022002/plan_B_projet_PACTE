import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, CircularProgress } from '@mui/material';
import { studioAPI } from '../../services/studioApi';
import { useToast } from '../../contexts/ToastContext';

/**
 * « Importer mes quiz » : les quiz que l'enseignant a encore dans le service de quiz (ClassQuiz)
 * passent dans le Studio, en brouillon à relire (sortie de ClassQuiz, lot SC-2). Rien ne s'affiche
 * s'il n'y en a pas, ou si le service de quiz n'est pas branché.
 * @param {{ onImporte: () => void }} props
 */
export default function ImporterClassQuiz({ onImporte }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [restants, setRestants] = useState(0);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    studioAPI
      .classquizAImporter()
      .then((r) => setRestants(r.a_importer ?? 0))
      .catch(() => setRestants(0));
  }, []);

  const importer = async () => {
    setEnvoi(true);
    try {
      const bilan = await studioAPI.classquizImporter();
      const ignorees = bilan.quiz.reduce((n, q) => n + (q.ignorees?.length ?? 0), 0);
      toast.success(t('studio.classquiz.fait', { count: bilan.importes }) + (ignorees ? ` ${t('studio.classquiz.ignorees', { count: ignorees })}` : ''));
      setRestants(0);
      onImporte();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  if (restants === 0) return null;
  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={importer} disabled={envoi} startIcon={envoi ? <CircularProgress size={14} color="inherit" /> : null}>
          {t('studio.classquiz.importer')}
        </Button>
      }
    >
      {t('studio.classquiz.texte', { count: restants })}
    </Alert>
  );
}
