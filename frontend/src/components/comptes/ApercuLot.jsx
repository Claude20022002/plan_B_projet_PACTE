import React from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Ce qu'un lot de désactivations touchera à la date choisie (lot ME-17, « aperçu puis appliquer ») :
 * le nombre de comptes désactivés et les refus prévus. `apercu` est la réponse de
 * GET /users/desactivations/apercu, `null` tant qu'elle charge. Pour une sélection, chaque refus
 * porte le nom du compte ; pour un groupe, les refus sont comptés par raison. Rien n'est modifié.
 */
export default function ApercuLot({ apercu, erreur, comptes }) {
    // `comptes` : la sélection, absente pour un groupe
    const { t } = useTranslation();
    if (erreur) return <Alert severity="error" sx={{ mt: 2 }}>{erreur}</Alert>;
    if (!apercu) return <Box sx={{ mt: 2 }}><CircularProgress size={20} aria-label={t('common.loading')} /></Box>;

    const refus = apercu.comptes.filter((c) => c.prevu !== 'a_desactiver');
    const lignes = comptes
        ? refus.map((c) => `${c.prenom} ${c.nom} : ${t(`comptes.apercuLot.prevu.${c.prevu}`)}`)
        : Object.entries(refus.reduce((acc, c) => ({ ...acc, [c.prevu]: (acc[c.prevu] ?? 0) + 1 }), {}))
            .map(([prevu, n]) => `${t(`comptes.apercuLot.prevu.${prevu}`)} (${n})`);

    return (
        <Box sx={{ mt: 2 }}>
            <Alert severity={apercu.a_desactiver ? 'info' : 'warning'}>
                {t('comptes.apercuLot.touches', { count: apercu.a_desactiver })}
            </Alert>
            {lignes.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">{t('comptes.apercuLot.refusPrevus', { count: lignes.length })}</Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {lignes.map((l) => <Typography key={l} component="li" variant="body2">{l}</Typography>)}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
