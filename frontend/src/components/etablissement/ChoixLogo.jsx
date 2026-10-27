import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DeleteOutline, Upload } from '@mui/icons-material';
import ConfirmDialog from '../common/ConfirmDialog';
import { ds } from '../../design-system/tokens';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const TAILLE_MAX = 512 * 1024;

/**
 * Logo de l'école : aperçu sur fond blanc (là où il s'affiche : menu, accueil, connexion),
 * envoi d'une image et retrait. Le type et la taille sont vérifiés ici pour un message immédiat,
 * puis de nouveau par le serveur, qui lit les premiers octets du fichier.
 */
export default function ChoixLogo({ adresse, nomCourt, enCours, onEnvoyer, onRetirer, onErreur }) {
  const { t } = useTranslation();
  const champ = useRef(null);
  const [confirmer, setConfirmer] = useState(false);

  const choisi = (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = '';
    if (!fichier) return;
    if (!TYPES.includes(fichier.type)) return onErreur(t('etablissement.logo.format'));
    if (fichier.size > TAILLE_MAX) return onErreur(t('etablissement.logo.tropLourd'));
    return onEnvoyer(fichier);
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ bgcolor: ds.white, border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.md}px`, p: 2, minHeight: 72, display: 'flex', alignItems: 'center', maxWidth: 420 }}>
        {adresse ? (
          <Box component="img" src={adresse} alt={t('etablissement.logo.actuel')} sx={{ maxHeight: 48, maxWidth: '100%', display: 'block' }} />
        ) : (
          <Typography sx={{ color: '#3F4759' }}>
            <Box component="strong" sx={{ fontFamily: ds.font.board, letterSpacing: '0.06em', textTransform: 'uppercase', color: ds.brand.navy, mr: 1 }}>{nomCourt}</Box>
            {t('etablissement.logo.aucun')}
          </Typography>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620 }}>
        {t('etablissement.logo.regles')}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <input ref={champ} type="file" accept={TYPES.join(',')} hidden onChange={choisi} />
        <Button variant="outlined" startIcon={<Upload />} onClick={() => champ.current?.click()} disabled={enCours}>
          {t('etablissement.logo.choisir')}
        </Button>
        {adresse && (
          <Button color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmer(true)} disabled={enCours}>
            {t('etablissement.logo.retirer')}
          </Button>
        )}
      </Stack>
      <ConfirmDialog
        open={confirmer}
        title={t('etablissement.logo.retirer')}
        message={t('etablissement.logo.confirmerRetrait')}
        confirmLabel={t('etablissement.logo.retirer')}
        onCancel={() => setConfirmer(false)}
        onConfirm={() => {
          setConfirmer(false);
          onRetirer();
        }}
      />
    </Stack>
  );
}
