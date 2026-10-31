import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { Add, DeleteOutline, Lock } from '@mui/icons-material';
import NouveauSondageDialog from './NouveauSondageDialog';
import { espaceCoursAPI } from '../../services/espaceCours';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { localeEcran } from '../../utils/dates';
import { SEUIL_ANONYMAT, repartition } from '../../../../shared/sondages.js';

/** État d'un sondage : « Ouvert », « Ouvert jusqu'au 6 nov. » ou « Fermé ». */
function PastilleEtat({ sondage }) {
  const { t, i18n } = useTranslation();
  if (!sondage.ouvert) return <Chip size="small" variant="outlined" icon={<Lock />} label={t('espaceCours.sondages.ferme')} />;
  const libelle = sondage.ferme_le
    ? t('espaceCours.sondages.ouvertJusquAu', { date: new Date(`${sondage.ferme_le}T12:00:00`).toLocaleDateString(localeEcran(i18n.language), { day: 'numeric', month: 'short' }) })
    : t('espaceCours.sondages.ouvert');
  return <Chip size="small" color="success" variant="outlined" label={libelle} />;
}

/**
 * Résultats d'un sondage pour l'enseignant (règle S-7) : le nombre de réponses toujours, la part de
 * chaque choix seulement à partir de SEUIL_ANONYMAT réponses (le serveur ne l'envoie pas avant).
 */
function CarteSondage({ sondage, onClore, onSupprimer }) {
  const { t } = useTranslation();
  const parts = repartition(sondage.choix);
  return (
    <Paper variant="outlined" sx={{ p: 2 }} component="article" aria-label={sondage.question}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: 1 }}>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 600, flex: 1, minWidth: 200 }}>
          {sondage.question}
        </Typography>
        <PastilleEtat sondage={sondage} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('espaceCours.sondages.reponses', { count: sondage.reponses, effectif: sondage.effectif })}
      </Typography>
      <Stack spacing={1}>
        {sondage.choix.map((c, i) => (
          <Box key={c.id_choix}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="body2">{c.libelle}</Typography>
              {parts && (
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {t('espaceCours.sondages.part', { count: c.reponses, pourcent: parts[i] })}
                </Typography>
              )}
            </Box>
            {parts && <LinearProgress variant="determinate" value={parts[i]} sx={{ height: 6, borderRadius: 3, mt: 0.5 }} aria-hidden />}
          </Box>
        ))}
      </Stack>
      {!parts && sondage.reponses > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {t('espaceCours.sondages.seuil', { count: SEUIL_ANONYMAT })}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
        {sondage.ouvert && (
          <Button size="small" startIcon={<Lock />} onClick={() => onClore(sondage)} sx={{ textTransform: 'none' }}>
            {t('espaceCours.sondages.clore')}
          </Button>
        )}
        <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => onSupprimer(sondage)} sx={{ textTransform: 'none' }}>
          {t('common.delete')}
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * Onglet « Sondages » d'une classe, pour l'enseignant (lot EC-9) : créer un sondage, suivre les
 * réponses, le clore ou le supprimer. Chaque action recharge la liste depuis le serveur.
 */
export default function OngletSondages({ idCours, idGroupe, sondages, onRecharger }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirmer = useConfirmation();
  const [creation, setCreation] = useState(false);

  const agir = async (action, succes) => {
    try {
      await action();
      toast.success(succes);
    } catch (e) {
      toast.error(e.message);
    } finally {
      onRecharger();
    }
  };
  const clore = async (s) => {
    if (await confirmer({ titre: t('espaceCours.sondages.clore'), message: t('espaceCours.sondages.cloreConfirmation'), libelle: t('espaceCours.sondages.clore') })) {
      await agir(() => espaceCoursAPI.cloreSondage(s.id_sondage), t('espaceCours.sondages.clos'));
    }
  };
  const supprimer = async (s) => {
    if (await confirmer({ message: t('espaceCours.sondages.supprimerConfirmation', { question: s.question }), libelle: t('common.delete') })) {
      await agir(() => espaceCoursAPI.supprimerSondage(s.id_sondage), t('espaceCours.sondages.supprime'));
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 220 }}>
          {t('espaceCours.sondages.aide')}
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreation(true)} sx={{ textTransform: 'none' }}>
          {t('espaceCours.sondages.nouveau')}
        </Button>
      </Box>
      {sondages.length === 0 ? (
        <Alert severity="info">{t('espaceCours.sondages.aucun')}</Alert>
      ) : (
        <Stack spacing={2}>
          {sondages.map((s) => (
            <CarteSondage key={s.id_sondage} sondage={s} onClore={clore} onSupprimer={supprimer} />
          ))}
        </Stack>
      )}
      <NouveauSondageDialog
        ouvert={creation}
        idCours={idCours}
        idGroupe={idGroupe}
        onFermer={() => setCreation(false)}
        onCree={() => {
          setCreation(false);
          toast.success(t('espaceCours.sondages.publie'));
          onRecharger();
        }}
      />
    </>
  );
}
