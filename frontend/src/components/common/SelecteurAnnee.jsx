import { MenuItem, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TOUTES, anneeEnCours } from '../../utils/annees';

/** Sélecteur d'année des pages de gestion (lot ME-18), à brancher sur useAnneeChoisie. */
export default function SelecteurAnnee({ annees, valeur, onChange, sx }) {
    const { t } = useTranslation();
    const courante = anneeEnCours(annees);
    return (
        <TextField
            select
            size="small"
            label={t('annees.selecteur')}
            value={valeur ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={valeur === null}
            sx={{ minWidth: 190, ...sx }}
        >
            {annees.map((a) => (
                <MenuItem key={a.id_annee} value={String(a.id_annee)}>
                    {a === courante ? t('annees.enCours', { annee: a.libelle }) : a.libelle}
                </MenuItem>
            ))}
            <MenuItem value={TOUTES}>{t('annees.toutes')}</MenuItem>
        </TextField>
    );
}
