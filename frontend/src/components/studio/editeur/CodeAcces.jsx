import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Box, Button, Dialog, IconButton, Stack, Typography } from '@mui/material';
import { Close, ContentCopy, Fullscreen, Link as IconeLien } from '@mui/icons-material';
import { useToast } from '../../../contexts/ToastContext';
import { lienQuiz } from '../outils';

/**
 * Les deux accès d'une passation : le code (saisi dans « Quiz », sur ordinateur comme sur
 * téléphone) et le QR code (scanné avec l'appareil photo du téléphone, il ouvre directement le
 * quiz : /quiz/code/<code>, avec retour au quiz après la connexion). « Afficher en grand » les
 * projette en classe.
 */

// Le QR reste noir sur blanc dans les deux thèmes : c'est ce que les appareils photo lisent le mieux
const useQr = (code, largeur) => {
  const [image, setImage] = useState(null);
  useEffect(() => {
    let actif = true;
    QRCode.toDataURL(lienQuiz(code), { errorCorrectionLevel: 'M', margin: 2, width: largeur, color: { dark: '#000000', light: '#FFFFFF' } })
      .then((url) => actif && setImage(url))
      .catch(() => actif && setImage(null));
    return () => {
      actif = false;
    };
  }, [code, largeur]);
  return image;
};

function CodeEnGrand({ code, taille }) {
  return (
    <Typography component="p" aria-label={code.split('').join(' ')} sx={{ fontSize: taille, fontWeight: 800, letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, textAlign: 'center' }}>
      {code}
    </Typography>
  );
}

export default function CodeAcces({ code, titre }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [grand, setGrand] = useState(false);
  const qr = useQr(code, 512);
  const qrGrand = useQr(code, 1024);

  const copier = async (texte, message) => {
    try {
      await navigator.clipboard.writeText(texte);
      toast.success(message);
    } catch {
      toast.error(texte);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
        {qr && <Box component="img" src={qr} alt={t('studio.passation.qrAlt', { lien: lienQuiz(code) })} sx={{ width: 168, height: 168, borderRadius: 2, border: 1, borderColor: 'divider' }} />}
        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="overline" color="text.secondary">
            {t('studio.passation.code')}
          </Typography>
          <Typography component="p" sx={{ fontSize: 44, fontWeight: 800, letterSpacing: '0.18em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {code}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
            {t('studio.passation.codeAide')}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: 'center', sm: 'flex-start' }}>
            <Button size="small" startIcon={<ContentCopy />} onClick={() => copier(code, t('studio.passation.copie'))}>
              {t('studio.passation.copier')}
            </Button>
            <Button size="small" startIcon={<IconeLien />} onClick={() => copier(lienQuiz(code), t('studio.passation.lienCopie'))}>
              {t('studio.passation.copierLien')}
            </Button>
            <Button size="small" variant="outlined" startIcon={<Fullscreen />} onClick={() => setGrand(true)}>
              {t('studio.passation.projeter')}
            </Button>
          </Stack>
        </Box>
      </Stack>

      <Dialog fullScreen open={grand} onClose={() => setGrand(false)}>
        <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, p: 4, bgcolor: 'background.default' }}>
          <IconButton onClick={() => setGrand(false)} aria-label={t('common.close')} sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Close />
          </IconButton>
          {titre && (
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700, textAlign: 'center' }}>
              {titre}
            </Typography>
          )}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={6} alignItems="center">
            {qrGrand && <Box component="img" src={qrGrand} alt="" sx={{ width: { xs: 260, md: 'min(42vh, 440px)' }, height: 'auto', borderRadius: 3 }} />}
            <Box>
              <Typography variant="h5" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
                {window.location.host}/quiz
              </Typography>
              <CodeEnGrand code={code} taille={{ xs: 56, md: 120 }} />
            </Box>
          </Stack>
          <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('studio.passation.codeAide')}
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
}
