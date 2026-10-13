import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { ds } from '../../../design-system/tokens';

/**
 * Salle d'attente projetée d'un quiz en direct : le QR que les étudiants scannent avec
 * l'application (il ouvre la partie de leur séance), le code de la partie pour qui l'aurait
 * manqué, les joueurs qui arrivent, et « Démarrer ».
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
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(300px, 34vw)' }, alignItems: 'start' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
        {qr ? (
          <Box component="img" src={qr} alt={t('quizDirect.qrAlt')} sx={{ width: 'min(60dvh, 100%)', aspectRatio: '1', borderRadius: 1, bgcolor: '#FFFFFF' }} />
        ) : (
          <Skeleton variant="rectangular" sx={{ width: 'min(60dvh, 100%)', height: 'auto', aspectRatio: '1', bgcolor: ds.board.cell }} />
        )}
        <Typography sx={{ fontSize: 'clamp(1rem, 2.6vh, 1.5rem)' }}>{t('quizDirect.consigne')}</Typography>
        <Typography sx={{ fontFamily: ds.font.board, fontSize: 'clamp(1.5rem, 4.5vh, 2.75rem)', letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>
          {t('quizDirect.code', { pin })}
        </Typography>
      </Box>

      <Box component="section" aria-labelledby="joueurs-titre" sx={{ minWidth: 0 }}>
        <Typography id="joueurs-titre" component="h2" aria-live="polite" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.5rem, 4.5vh, 3rem)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {t('quizDirect.joueurs', { count: joueurs.length })}
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrow />}
          onClick={onDemarrer}
          disabled={joueurs.length === 0}
          sx={{ mt: 2, bgcolor: ds.board.letter, color: ds.board.ground, '&:hover': { bgcolor: ds.board.letter, opacity: 0.88 } }}
        >
          {t('quizDirect.demarrer')}
        </Button>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 2, p: 0, display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', maxHeight: { md: 'calc(100dvh - 300px)' }, overflowY: 'auto' }}>
          {joueurs.map((nom) => (
            <Box component="li" key={nom} sx={{ px: 1.25, py: 1, borderRadius: `${ds.radius.md}px`, bgcolor: ds.board.cell, border: `1px solid ${ds.board.seam}`, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nom}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
