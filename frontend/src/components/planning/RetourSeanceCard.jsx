import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { suiviAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';

/**
 * Retour de séance en un clic (innovation I7) : après une séance réalisée, l'étudiant peut
 * donner une note de 1 à 5 et un mot, anonymement. Facultatif : « Plus tard » masque la carte.
 * L'enseignant ne voit qu'une tendance par module, à partir de 5 réponses.
 */
export default function RetourSeanceCard() {
    const { t } = useTranslation();
    const toast = useToast();
    const [seances, setSeances] = useState([]);
    const [note, setNote] = useState(null);
    const [mot, setMot] = useState('');
    const [envoi, setEnvoi] = useState(false);

    useEffect(() => {
        suiviAPI.retoursADonner().then(setSeances).catch(() => {});
    }, []);

    const seance = seances[0];
    if (!seance) return null;

    const suivante = () => {
        setSeances((s) => s.slice(1));
        setNote(null);
        setMot('');
    };

    const envoyer = async () => {
        setEnvoi(true);
        try {
            await suiviAPI.deposerRetour(seance.id_affectation, { note, mot: mot.trim() || undefined });
            toast.success(t('feedback.thanks'));
            suivante();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {t('feedback.title')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {seance.cours?.nom_cours}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                {seance.date_seance} · {String(seance.creneau?.heure_debut).slice(0, 5)} · {seance.enseignant?.prenom?.[0]}. {seance.enseignant?.nom}
            </Typography>
            <ToggleButtonGroup exclusive value={note} onChange={(_, v) => v && setNote(v)} size="small" fullWidth aria-label={t('feedback.question')}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <ToggleButton key={n} value={n} aria-label={t('feedback.score', { n })} sx={{ fontFamily: ds.font.board, fontWeight: 700 }}>
                        {n}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    {t('feedback.low')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {t('feedback.high')}
                </Typography>
            </Stack>
            <TextField size="small" fullWidth label={t('feedback.word')} value={mot} onChange={(e) => setMot(e.target.value.slice(0, 40))} helperText={t('feedback.anonymous')} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                <Button size="small" onClick={suivante}>
                    {t('feedback.later')}
                </Button>
                <Button size="small" variant="contained" onClick={envoyer} disabled={!note || envoi}>
                    {t('feedback.send')}
                </Button>
            </Box>
        </Paper>
    );
}
