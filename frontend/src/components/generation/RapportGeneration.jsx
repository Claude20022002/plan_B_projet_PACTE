import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Collapse, List, ListItem, Stack, Typography } from '@mui/material';
import { ArrowForward, ExpandLess, ExpandMore } from '@mui/icons-material';
import AvertissementsGeneration from '../planning/AvertissementsGeneration';
import DetailEnseignements from './DetailEnseignements';
import { ds } from '../../design-system/tokens';
import { localeEcran } from '../../utils/dates';

/** Le résumé d'un rapport ; recalculé pour un rapport d'avant le résumé du serveur (M-3). */
const resumeDe = (rapport) =>
    rapport.resume ?? {
        seances_creees: rapport.seances_creees,
        enseignements_complets: rapport.enseignements.filter((e) => e.complet).length,
        enseignements_incomplets: rapport.enseignements.filter((e) => !e.complet).length,
        enseignements_exclus: rapport.exclus.length,
        conflits: 0,
    };

function Chiffre({ libelle, valeur, alerte = false }) {
    return (
        <Box>
            <Typography sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: alerte ? 'warning.dark' : 'text.primary' }}>{valeur}</Typography>
            <Typography variant="caption" color="text.secondary">
                {libelle}
            </Typography>
        </Box>
    );
}

/**
 * Rapport d'une génération terminée (recette du 20 octobre, M-3 ; R-4) : un résumé en chiffres
 * positifs, puis ce qu'il reste à corriger, chaque point avec le lien de l'écran qui le corrige.
 * Le détail des enseignements incomplets reste replié : la page ne fait plus des milliers de pixels.
 * Le score interne du solveur et ses contraintes ne s'affichent plus. Les séances générées ne
 * parviennent aux étudiants qu'une fois le mois publié (décision du 21 octobre 2026) : le rapport
 * le dit et mène à l'EDT du mois.
 */
export default function RapportGeneration({ rapport }) {
    const { t, i18n } = useTranslation();
    const nombre = useMemo(() => new Intl.NumberFormat(localeEcran(i18n.language), { maximumFractionDigits: 1 }), [i18n.language]);
    const [detail, setDetail] = useState(false);
    const resume = resumeDe(rapport);
    const incomplets = rapport.enseignements.filter((e) => !e.complet);

    return (
        <Stack spacing={2.5}>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Chiffre libelle={t('gen.report.created')} valeur={resume.seances_creees} />
                <Chiffre libelle={t('gen.report.complete')} valeur={resume.enseignements_complets} />
                <Chiffre libelle={t('gen.report.incomplete')} valeur={resume.enseignements_incomplets} alerte={resume.enseignements_incomplets > 0} />
                <Chiffre libelle={t('gen.report.excluded')} valeur={resume.enseignements_exclus} alerte={resume.enseignements_exclus > 0} />
                <Chiffre libelle={t('gen.report.conflicts')} valeur={resume.conflits} />
            </Stack>

            {resume.seances_creees > 0 && (
                <Alert
                    severity="info"
                    action={
                        <Button component={RouterLink} to="/emploi-du-temps/mensuel" size="small" color="inherit" endIcon={<ArrowForward />}>
                            {t('gen.report.publishLink')}
                        </Button>
                    }
                >
                    {t('gen.report.publish')}
                </Alert>
            )}

            {rapport.a_corriger ? (
                <Box component="section" aria-labelledby="titre-a-corriger">
                    <Typography id="titre-a-corriger" component="h2" variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {t('gen.report.toFix')}
                    </Typography>
                    {rapport.a_corriger.length === 0 ? (
                        <Alert severity="success">{t('gen.report.nothingToFix')}</Alert>
                    ) : (
                        <List dense disablePadding>
                            {rapport.a_corriger.map((p, i) => (
                                <ListItem key={`${p.type}-${i}`} disableGutters divider sx={{ gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, alignItems: 'flex-start' }}>
                                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                                        {p.texte}
                                    </Typography>
                                    <Button component={RouterLink} to={p.lien} size="small" endIcon={<ArrowForward />} sx={{ flexShrink: 0 }}>
                                        {t('gen.report.fix')}
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            ) : (
                // Rapport d'une génération d'avant M-3 : ses avertissements, sans liens
                <AvertissementsGeneration avertissements={rapport.avertissements ?? []} nombre={nombre} />
            )}

            {incomplets.length > 0 && (
                <Box>
                    <Button onClick={() => setDetail((d) => !d)} endIcon={detail ? <ExpandLess /> : <ExpandMore />} aria-expanded={detail} size="small" color="inherit">
                        {t('gen.report.detail', { count: incomplets.length })}
                    </Button>
                    <Collapse in={detail} unmountOnExit>
                        <DetailEnseignements enseignements={incomplets} nombre={nombre} />
                    </Collapse>
                </Box>
            )}
        </Stack>
    );
}
