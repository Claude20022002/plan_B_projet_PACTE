import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';

/**
 * Avertissements du rapport de génération : ce qu'aucun calcul ne pouvait résoudre, à corriger avant
 * de relancer. Le serveur en donne deux sortes (backend/services/generation/timefold/avertissements.js) :
 * disponibilités insuffisantes et plafond hebdomadaire dépassé. Une sorte inconnue n'est pas affichée.
 */

const MESSAGES = {
    disponibilites_insuffisantes: (t, a) => t('gen.report.notEnoughAvailability', { name: a.enseignant, sessions: a.seances, free: a.creneaux_libres }),
    plafond_hebdomadaire: (t, a, nombre) => t('gen.report.weeklyCapExceeded', { name: a.enseignant, hours: nombre.format(a.heures_semaine), cap: nombre.format(a.plafond_heures) }),
};

/** Rend la liste des avertissements, ou rien s'il n'y en a pas. */
export default function AvertissementsGeneration({ avertissements, nombre }) {
    const { t } = useTranslation();
    const connus = avertissements.filter((a) => MESSAGES[a.type]);
    if (!connus.length) return null;
    return (
        <Box sx={{ borderLeft: '3px solid', borderColor: 'warning.main', pl: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {t('gen.report.warningsTitle')}
            </Typography>
            {connus.map((a) => (
                <Typography key={`${a.type}-${a.id_user}`} variant="body2" color="text.secondary">
                    {MESSAGES[a.type](t, a, nombre)}
                </Typography>
            ))}
        </Box>
    );
}
