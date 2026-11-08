import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { EventRepeat } from '@mui/icons-material';
import { dateEtHeure, origineDe } from './format';

/**
 * Séances à reprogrammer (administration, R-1) : les reports acceptés sans date. Chaque séance a
 * quitté l'emploi du temps et attend sa nouvelle date ; « Fixer la date » ouvre l'assistant de
 * créneaux libres (`onFixerDate(demande)`). Rien n'est affiché quand aucune séance n'attend.
 * `enCours` : la demande dont la date part, dont le bouton attend.
 */
export default function SeancesAReprogrammer({ demandes, creneaux, enCours, onFixerDate }) {
    const { t, i18n } = useTranslation();
    const aReprogrammer = demandes.filter((d) => d.statut_demande === 'a_reprogrammer');
    if (aReprogrammer.length === 0) return null;

    return (
        <Paper component="section" aria-labelledby="titre-a-reprogrammer" variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography id="titre-a-reprogrammer" component="h2" variant="h6">
                {t('reportsAdmin.aReprogrammer.titre')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('reportsAdmin.aReprogrammer.aide')}
            </Typography>
            <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {aReprogrammer.map((d) => (
                    <Box
                        component="li"
                        key={d.id_demande}
                        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1, borderTop: 1, borderColor: 'divider' }}
                    >
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {[d.affectation?.cours?.nom_cours, d.affectation?.groupe?.nom_groupe].filter(Boolean).join(' · ') || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('reportsAdmin.aReprogrammer.prevue', {
                                    date: dateEtHeure(origineDe(d, creneaux), i18n.language),
                                    enseignant: [d.enseignant?.prenom, d.enseignant?.nom].filter(Boolean).join(' ') || '—',
                                })}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => onFixerDate(d)}
                            disabled={enCours === d.id_demande}
                            startIcon={enCours === d.id_demande ? <CircularProgress size={16} color="inherit" /> : <EventRepeat />}
                        >
                            {t('reportsAdmin.fixerDate')}
                        </Button>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}
