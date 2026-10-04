import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { suiviAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';

/**
 * Tendance des retours de séance par module pour l'enseignant (innovation I7) : moyenne,
 * répartition des notes et mots qui reviennent ; rien n'est montré sous 5 réponses.
 */
export default function MesRetours() {
    const { t, i18n } = useTranslation();
    const [modules, setModules] = useState(null);
    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);

    useEffect(() => {
        suiviAPI.mesRetours().then(setModules).catch(() => setModules([]));
    }, []);

    if (!modules || modules.length === 0) return null;

    return (
        <Paper sx={{ p: { xs: 1.5, md: 2 }, mt: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {t('feedback.mineTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('feedback.mineIntro')}
            </Typography>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                {modules.map((m) => (
                    <Stack key={m.module.id_cours} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} alignItems={{ sm: 'center' }} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {m.module.nom_cours}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('feedback.answers', { count: m.nombre })}
                                {m.visible && m.mots.length > 0 && ` · ${m.mots.map((x) => `« ${x.mot} »`).join(', ')}`}
                            </Typography>
                        </Box>
                        {m.visible ? (
                            <Stack direction="row" spacing={1.5} alignItems="flex-end">
                                <Stack direction="row" spacing={0.25} alignItems="flex-end" aria-label={t('feedback.distribution')} sx={{ height: 28 }}>
                                    {m.repartition.map((n, i) => (
                                        <Box key={i} title={`${i + 1} : ${n}`} sx={{ width: 8, height: `${Math.max(2, (28 * n) / Math.max(...m.repartition))}px`, bgcolor: 'primary.main', opacity: 0.35 + i * 0.15 }} />
                                    ))}
                                </Stack>
                                <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>{nombre.format(m.moyenne)}/5</Typography>
                            </Stack>
                        ) : (
                            <Typography variant="caption" color="text.secondary">
                                {t('feedback.notEnough')}
                            </Typography>
                        )}
                    </Stack>
                ))}
            </Box>
        </Paper>
    );
}
