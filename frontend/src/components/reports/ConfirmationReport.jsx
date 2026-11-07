import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { dateLongue, heureCourte } from './format';

/**
 * Report validé par l'administration, qui attend la réponse de l'enseignant (décision du
 * 21 octobre) : la place proposée (jour, heure, salle), puis « Accepter » ou « Proposer un autre
 * créneau ». La séance ne bouge, et les étudiants ne sont prévenus, qu'une fois la réponse donnée.
 * `enCours` : la réponse part, les deux boutons attendent.
 */
export default function ConfirmationReport({ demande, enCours = false, onAccepter, onProposer }) {
    const { t, i18n } = useTranslation();

    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('reports.aConfirmer', {
                    jour: dateLongue(demande.nouvelle_date, i18n.language),
                    heure: heureCourte(demande.creneauNouveau?.heure_debut),
                    salle: demande.salleNouvelle?.nom_salle ?? t('assistant.remote'),
                })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Button
                    size="small"
                    variant="contained"
                    onClick={() => onAccepter(demande)}
                    disabled={enCours}
                    startIcon={enCours ? <CircularProgress size={14} color="inherit" /> : null}
                >
                    {t('reports.accepter')}
                </Button>
                <Button size="small" variant="outlined" onClick={() => onProposer(demande)} disabled={enCours}>
                    {t('reports.proposer')}
                </Button>
            </Box>
        </Box>
    );
}
