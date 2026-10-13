import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { ds } from '../../../design-system/tokens';
import { carteSx } from '../../../design-system/cartes';
import { BulleJoueur } from '../../../design-system/jeu';

/**
 * Salle d'attente projetée d'un quiz en direct : le QR que les étudiants scannent avec
 * l'application (il ouvre la partie de leur séance) et le code de la partie dans une carte,
 * les joueurs qui arrivent en bulles, et « Démarrer ».
 */
export default function SalleAttente({ pin, adresse, joueurs, onDemarrer }) {
  const { t } = useTranslation();
  const [qr, setQr] = useState(null);

  useEffect(() => {
    let actif = true;
    if (!adresse) return undefined;
    QRCode.toDataURL(adresse, { errorCorrectionLevel: 'M', margin: 2, width: 1024, color: { dark: '#000000', light: '#FFFFFF' } })
      .then((image) => actif && setQr(image))
      .catch(() => actif && setQr(null));
    return () => {
      actif = false;
    };
  }, [adresse]);

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 4 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 38vw) minmax(0, 1fr)' }, alignItems: 'start' }}>
      <Box sx={{ ...carteSx, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, p: { xs: 2, md: 3 }, textAlign: 'center' }}>
        {qr ? (
          <Box component="img" src={qr} alt={t('quizDirect.qrAlt')} sx={{ width: 'min(52dvh, 100%)', aspectRatio: '1', borderRadius: `${ds.radius.md}px` }} />
        ) : (
          <Skeleton variant="rounded" sx={{ width: 'min(52dvh, 100%)', height: 'auto', aspectRatio: '1' }} />
        )}
        <Typography sx={{ fontSize: 'clamp(1rem, 2.4vh, 1.375rem)', color: 'text.secondary' }}>{t('quizDirect.consigne')}</Typography>
        <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(2rem, 6.5vh, 4rem)', letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {t('quizDirect.code', { pin })}
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="joueurs-titre" sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography id="joueurs-titre" component="h2" aria-live="polite" sx={{ flexGrow: 1, fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.75rem, 5vh, 3.25rem)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {t('quizDirect.joueurs', { count: joueurs.length })}
          </Typography>
          <Button variant="contained" size="large" startIcon={<PlayArrow />} onClick={onDemarrer} disabled={joueurs.length === 0} sx={{ minHeight: 56, px: 4, fontSize: 'clamp(1.05rem, 2.4vh, 1.375rem)' }}>
            {t('quizDirect.demarrer')}
          </Button>
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 3, p: 0, display: 'flex', flexWrap: 'wrap', gap: 1.25, maxHeight: { md: 'calc(100dvh - 260px)' }, overflowY: 'auto' }}>
          {joueurs.map((nom) => (
            <Box component="li" key={nom} sx={{ maxWidth: '100%' }}>
              <BulleJoueur nom={nom} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
