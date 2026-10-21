import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const COULEURS = { approuve: 'success', refuse: 'error', en_attente: 'warning' };

/** Statut d'une demande de report : En attente, Approuvée ou Refusée, en toutes lettres. */
export default function StatutDemande({ statut }) {
    const { t } = useTranslation();
    const connu = COULEURS[statut] ? statut : 'en_attente';
    return <Chip label={t(`reports.statuts.${connu}`)} size="small" color={COULEURS[connu]} />;
}
