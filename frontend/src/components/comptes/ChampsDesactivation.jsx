import React from 'react';
import { Box, Checkbox, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { aujourdhui } from '../../../../shared/dates.js';
import { MOTIFS } from './motifs';

/**
 * Champs communs à la désactivation d'un compte et à celle d'une sélection (lot ME-17) : motif,
 * date d'effet et préavis. Le préavis n'a de sens que pour une date à venir : une désactivation
 * immédiate n'en a pas (fichier 11, § 11.2).
 */
export default function ChampsDesactivation({ valeurs, onChange }) {
    const { t } = useTranslation();
    const programmee = valeurs.date > aujourdhui();
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
                <InputLabel id="motif-desactivation">{t('comptes.motif')}</InputLabel>
                <Select labelId="motif-desactivation" label={t('comptes.motif')} value={valeurs.motif} onChange={(e) => onChange({ motif: e.target.value })}>
                    {MOTIFS.map((m) => (
                        <MenuItem key={m} value={m}>{t(`comptes.motifs.${m}`)}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                type="date"
                label={t('comptes.dateEffet')}
                value={valeurs.date}
                onChange={(e) => onChange({ date: e.target.value || aujourdhui() })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: aujourdhui() } }}
                helperText={t(programmee ? 'comptes.dateAideProgrammee' : 'comptes.dateAideImmediate')}
            />
            {programmee && (
                <Box>
                    <FormControlLabel
                        control={<Checkbox checked={valeurs.preavis} onChange={(e) => onChange({ preavis: e.target.checked })} />}
                        label={t('comptes.preavis')}
                    />
                    <FormHelperText sx={{ mt: -0.5, ml: 4 }}>{t('comptes.preavisAide')}</FormHelperText>
                </Box>
            )}
        </Box>
    );
}
