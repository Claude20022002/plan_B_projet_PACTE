import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Autocomplete, Box, Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, PictureAsPdf } from '@mui/icons-material';
import DocumentEdtMois, { StyleImpressionEdt } from '../edt/DocumentEdtMois';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import TableauSeancesClasse from './TableauSeancesClasse';
import useExploration from './useExploration';
import useImpressionClasses from './useImpressionClasses';
import { localeEcran } from '../../utils/dates';

const libelleMois = (mois, langue) => new Date(`${mois}-01T12:00:00`).toLocaleDateString(localeEcran(langue), { month: 'long', year: 'numeric' });

/**
 * « Explorer les emplois du temps » après une génération (R-4, décision n° 4 : les classes
 * seulement). Une classe à la fois, avec « Précédente » et « Suivante », pour un mois : au format
 * de l'école (le rendu du PDF officiel) ou en tableau. Le PDF se fait pour la classe affichée ou
 * pour toutes les classes du mois, par la fenêtre d'impression du navigateur.
 * `idSnapshot` : la version créée par la génération.
 */
export default function ExplorerEmplois({ idSnapshot }) {
    const { t, i18n } = useTranslation();
    const { chargement, erreur, classes, chargerEdt } = useExploration(idSnapshot);
    const { imprimer, aImprimer, preparation } = useImpressionClasses(chargerEdt);
    const [index, setIndex] = useState(0);
    const [mois, setMois] = useState('');
    const [vue, setVue] = useState('ecole');
    const [edt, setEdt] = useState(null);
    const [erreurEdt, setErreurEdt] = useState(false);
    const classe = classes[index] ?? null;

    // Une autre classe n'a pas forcément cours le mois affiché : son premier mois de cours
    useEffect(() => {
        if (classe && !classe.mois.includes(mois)) setMois(classe.mois[0] ?? '');
    }, [classe, mois]);

    useEffect(() => {
        if (vue !== 'ecole' || !classe || !mois) return undefined;
        let actif = true;
        setEdt(null);
        setErreurEdt(false);
        chargerEdt(classe.id_groupe, mois)
            .then((doc) => actif && setEdt(doc))
            .catch(() => actif && setErreurEdt(true));
        return () => {
            actif = false;
        };
    }, [vue, classe, mois, chargerEdt]);

    if (chargement) return <TableSkeleton rows={6} />;
    if (erreur) return <Alert severity="error">{t('gen.explore.error')}</Alert>;
    if (!classe) return <Alert severity="info">{t('gen.explore.empty')}</Alert>;

    const seancesDuMois = classe.seances.filter((s) => String(s.date_seance).startsWith(mois));
    const classesDuMois = classes.filter((c) => c.mois.includes(mois));

    return (
        <Box component="section" aria-labelledby="titre-explorer">
            <StyleImpressionEdt />
            <Typography id="titre-explorer" component="h2" variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                {t('gen.explore.title')}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Button startIcon={<ChevronLeft />} onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
                    {t('gen.explore.previous')}
                </Button>
                <Autocomplete
                    size="small"
                    sx={{ minWidth: 220, flex: { xs: '1 1 100%', sm: '0 1 auto' }, order: { xs: -1, sm: 0 } }}
                    options={classes}
                    value={classe}
                    disableClearable
                    onChange={(_, c) => setIndex(classes.indexOf(c))}
                    getOptionLabel={(c) => c.nom_groupe}
                    isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
                    renderInput={(p) => <TextField {...p} label={t('gen.explore.class')} helperText={t('gen.explore.position', { n: index + 1, total: classes.length })} />}
                />
                <Button endIcon={<ChevronRight />} onClick={() => setIndex((i) => i + 1)} disabled={index === classes.length - 1}>
                    {t('gen.explore.next')}
                </Button>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ mb: 1 }}>
                <TextField select size="small" label={t('gen.explore.month')} value={mois} onChange={(e) => setMois(e.target.value)} sx={{ minWidth: 180 }}>
                    {classe.mois.map((m) => (
                        <MenuItem key={m} value={m}>
                            {libelleMois(m, i18n.language)}
                        </MenuItem>
                    ))}
                </TextField>
                <ToggleButtonGroup size="small" exclusive value={vue} onChange={(_, v) => v && setVue(v)} aria-label={t('gen.explore.view')}>
                    <ToggleButton value="ecole">{t('gen.explore.school')}</ToggleButton>
                    <ToggleButton value="tableau">{t('gen.explore.table')}</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={() => imprimer([classe], mois)} disabled={Boolean(preparation)}>
                    {t('gen.explore.pdfClass')}
                </Button>
                <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={() => imprimer(classesDuMois, mois)} disabled={Boolean(preparation)}>
                    {t('gen.explore.pdfAll', { count: classesDuMois.length })}
                </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" role="status" sx={{ display: 'block', mb: 1.5 }}>
                {preparation ? t('gen.explore.preparing', preparation) : t('monthly.help')}
            </Typography>

            {vue === 'tableau' ? (
                <TableauSeancesClasse seances={seancesDuMois} titre={`${classe.nom_groupe} · ${libelleMois(mois, i18n.language)}`} />
            ) : erreurEdt ? (
                <Alert severity="error">{t('gen.explore.error')}</Alert>
            ) : edt ? (
                <DocumentEdtMois edt={edt} />
            ) : (
                <TableSkeleton rows={8} />
            )}

            {/* Zone d'impression, cachée à l'écran et posée dans <body> : les documents demandés en PDF */}
            {aImprimer &&
                createPortal(
                    <Box className="edt-impression edt-impression-seule" sx={{ display: 'none' }}>
                        {aImprimer.map((d) => (
                            <DocumentEdtMois key={d.cle} edt={d.edt} />
                        ))}
                    </Box>,
                    document.body
                )}
        </Box>
    );
}
