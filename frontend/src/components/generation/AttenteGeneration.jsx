import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, LinearProgress, Stack, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { Stop } from '@mui/icons-material';

// Étapes d'une génération, dans l'ordre où le serveur les traverse (config.etape, R-4)
const ETAPES = ['preparation', 'calcul', 'placement'];

/** Étape en cours : celle du serveur, sinon déduite de l'avancement (génération lancée avant R-4). */
const etapeDe = (session) => {
    if (ETAPES.includes(session.config?.etape)) return session.config.etape;
    const progres = session.progress || 0;
    return progres < 10 ? 'preparation' : progres < 75 ? 'calcul' : 'placement';
};

/** « 1 min 05 s », « 42 s » : le temps écoulé depuis le lancement. */
const duree = (secondes) => {
    const s = Math.max(0, Math.floor(secondes));
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

/**
 * Écran d'attente d'une génération (R-4) : où elle en est (préparation, calcul de la semaine type,
 * placement sur les dates), depuis combien de temps, et le bouton pour l'arrêter en gardant la
 * meilleure solution trouvée (`onArreter`).
 */
export default function AttenteGeneration({ session, onArreter }) {
    const { t } = useTranslation();
    const [maintenant, setMaintenant] = useState(() => Date.now());
    const etape = etapeDe(session);

    useEffect(() => {
        const id = setInterval(() => setMaintenant(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 1.5, md: 2.5 } }}>
            <Stepper activeStep={ETAPES.indexOf(etape)} alternativeLabel sx={{ mb: 2 }}>
                {ETAPES.map((e) => (
                    <Step key={e}>
                        <StepLabel>{t(`gen.wait.steps.${e}`)}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            <LinearProgress variant="determinate" value={session.progress || 0} aria-label={t('gen.wait.progress')} sx={{ height: 6, borderRadius: 1, mb: 1.5, bgcolor: 'divider' }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                {/* Lu par le lecteur d'écran à chaque changement d'étape */}
                <Box role="status" aria-live="polite">
                    <Typography variant="subtitle2">{t(`gen.wait.now.${etape}`)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('gen.wait.since', { duree: duree((maintenant - new Date(session.createdAt).getTime()) / 1000) })}
                    </Typography>
                </Box>
                <Button variant="outlined" color="inherit" startIcon={<Stop />} onClick={onArreter}>
                    {t('gen.stop')}
                </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                {t('gen.wait.help')}
            </Typography>
        </Box>
    );
}
