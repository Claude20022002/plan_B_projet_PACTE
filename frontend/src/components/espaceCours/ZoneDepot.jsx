import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, LinearProgress, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { deposerFichier, titreDuFichier } from '../../services/espaceCours';
import { useToast } from '../../contexts/ToastContext';

// Mêmes types que la Bibliothèque accepte pour un document de classe (StoreClassDocumentRequest)
const ACCEPTES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp';
const TAILLE_MAX = 20 * 1024 * 1024;

/**
 * Zone de dépôt d'une section : glisser-déposer ou choisir un ou plusieurs fichiers. Chaque
 * fichier part seul, avec sa barre de progression ; un fichier refusé n'arrête pas les autres.
 * Le titre proposé est le nom du fichier, modifiable ensuite.
 */
export default function ZoneDepot({ idSection, onDepose }) {
  const { t } = useTranslation();
  const toast = useToast();
  const champ = useRef(null);
  const [survol, setSurvol] = useState(false);
  const [envois, setEnvois] = useState([]); // [{ cle, nom, progression }]

  const envoyer = async (fichiers) => {
    for (const fichier of fichiers) {
      if (fichier.size > TAILLE_MAX) {
        toast.error(t('espaceCours.depot.tropGros', { nom: fichier.name }));
        continue;
      }
      const cle = `${fichier.name}-${Date.now()}`;
      setEnvois((e) => [...e, { cle, nom: fichier.name, progression: 0 }]);
      try {
        await deposerFichier(idSection, fichier, titreDuFichier(fichier), (p) =>
          setEnvois((e) => e.map((x) => (x.cle === cle ? { ...x, progression: p } : x)))
        );
        onDepose?.();
      } catch (e) {
        toast.error(t('espaceCours.depot.echec', { nom: fichier.name, raison: e.message }));
      } finally {
        setEnvois((e) => e.filter((x) => x.cle !== cle));
      }
    }
  };

  const deposer = (e) => {
    e.preventDefault();
    setSurvol(false);
    envoyer([...(e.dataTransfer?.files ?? [])]);
  };

  return (
    <Box sx={{ mt: 1 }}>
      <ButtonBase
        onClick={() => champ.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={deposer}
        aria-label={t('espaceCours.depot.choisir')}
        sx={{
          width: '100%',
          py: 1.5,
          px: 2,
          gap: 1.5,
          justifyContent: 'flex-start',
          border: '1px dashed',
          borderColor: survol ? 'primary.main' : 'divider',
          bgcolor: survol ? 'action.hover' : 'transparent',
          borderRadius: 1,
          color: 'text.secondary',
          transition: 'border-color 120ms, background-color 120ms',
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
        }}
      >
        <CloudUpload aria-hidden="true" />
        <Typography variant="body2">{t('espaceCours.depot.consigne')}</Typography>
      </ButtonBase>
      <input
        ref={champ}
        type="file"
        multiple
        accept={ACCEPTES}
        hidden
        onChange={(e) => {
          envoyer([...e.target.files]);
          e.target.value = '';
        }}
      />
      {envois.map((x) => (
        <Box key={x.cle} sx={{ mt: 1 }} role="status" aria-live="polite">
          <Typography variant="caption" color="text.secondary">
            {t('espaceCours.depot.enCours', { nom: x.nom, progression: x.progression })}
          </Typography>
          <LinearProgress variant="determinate" value={x.progression} />
        </Box>
      ))}
    </Box>
  );
}
