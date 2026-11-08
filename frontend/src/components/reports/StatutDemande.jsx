import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

// « À confirmer » : validée par l'administration, elle attend la réponse de l'enseignant (décision du 21 octobre).
// « Date à venir » : acceptée sans date (R-1), elle attend que l'administration fixe la nouvelle date.
const COULEURS = { approuve: 'success', refuse: 'error', en_attente: 'warning', a_confirmer: 'info', a_reprogrammer: 'secondary' };

/** Statut d'une demande de report : En attente, Date à venir, À confirmer, Approuvée ou Refusée, en toutes lettres. */
export default function StatutDemande({ statut }) {
    const { t } = useTranslation();
    const connu = COULEURS[statut] ? statut : 'en_attente';
    return <Chip label={t(`reports.statuts.${connu}`)} size="small" color={COULEURS[connu]} />;
}
