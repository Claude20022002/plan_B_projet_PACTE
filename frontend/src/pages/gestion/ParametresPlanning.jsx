import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    FormControlLabel,
    InputAdornment,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { parametrePlanningAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

// Ordre d'affichage et nature de chaque paramètre (les valeurs et validations viennent du serveur)
const PARAMETRES = [
    { cle: 'max_heures_jour_groupe', type: 'entier', unite: 'h', min: 1, max: 12 },
    { cle: 'max_heures_jour_enseignant', type: 'entier', unite: 'h', min: 1, max: 12 },
    { cle: 'pause_vendredi', type: 'plage' },
    { cle: 'samedi_apres_midi_initiale', type: 'booleen' },
    { cle: 'duree_seance_defaut_minutes', type: 'entier', unite: 'min', min: 30, max: 300 },
    { cle: 'ratio_capacite_examen', type: 'pourcentage', min: 1, max: 100 },
    { cle: 'trajet_inter_campus_defaut_minutes', type: 'entier', unite: 'min', min: 0, max: 240 },
];

const versSaisie = (type, valeur) => (type === 'pourcentage' ? String(Math.round(valeur * 100)) : type === 'entier' ? String(valeur) : valeur);
const depuisSaisie = (type, saisie) => (type === 'pourcentage' ? Number(saisie) / 100 : type === 'entier' ? Number(saisie) : saisie);

export default function ParametresPlanning() {
    const { t } = useTranslation();
    const toast = useToast();
    const [parametres, setParametres] = useState(null);
    const [saisies, setSaisies] = useState({});

    const charger = useCallback(async () => {
        try {
            const donnees = await parametrePlanningAPI.getAll();
            setParametres(donnees);
            setSaisies(Object.fromEntries(PARAMETRES.map(({ cle, type }) => [cle, versSaisie(type, donnees[cle].valeur)])));
        } catch {
            toast.error(t('common.errorLoad'));
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const enregistrer = async ({ cle, type }, valeurSaisie = saisies[cle]) => {
        try {
            await parametrePlanningAPI.update(cle, depuisSaisie(type, valeurSaisie));
            toast.success(t('ref.settings.saved'));
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const retablir = async (cle) => {
        try {
            await parametrePlanningAPI.reset(cle);
            toast.success(t('ref.settings.resetDone'));
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const valeurDefaut = ({ cle, type, unite }) => {
        const defaut = parametres[cle].defaut;
        if (type === 'booleen') return defaut ? t('ref.settings.allowed') : t('ref.settings.notAllowed');
        if (type === 'plage') return defaut.active ? `${defaut.debut} – ${defaut.fin}` : t('ref.settings.disabled');
        if (type === 'pourcentage') return `${Math.round(defaut * 100)} %`;
        return `${defaut} ${unite}`;
    };

    const controle = (parametre) => {
        const { cle, type, unite, min, max } = parametre;
        const saisie = saisies[cle];
        if (type === 'booleen') {
            return (
                <FormControlLabel
                    control={<Switch checked={Boolean(saisie)} onChange={(e) => enregistrer(parametre, e.target.checked)} />}
                    label={saisie ? t('ref.settings.allowed') : t('ref.settings.notAllowed')}
                />
            );
        }
        if (type === 'plage') {
            const changer = (champ, valeur) => setSaisies((s) => ({ ...s, [cle]: { ...s[cle], [champ]: valeur } }));
            return (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    <FormControlLabel
                        control={<Switch checked={saisie.active} onChange={(e) => changer('active', e.target.checked)} />}
                        label={saisie.active ? t('ref.settings.enabled') : t('ref.settings.disabled')}
                    />
                    <TextField size="small" type="time" label={t('ref.settings.from')} value={saisie.debut} onChange={(e) => changer('debut', e.target.value)} InputLabelProps={{ shrink: true }} disabled={!saisie.active} />
                    <TextField size="small" type="time" label={t('ref.settings.to')} value={saisie.fin} onChange={(e) => changer('fin', e.target.value)} InputLabelProps={{ shrink: true }} disabled={!saisie.active} />
                    <Button variant="outlined" size="small" onClick={() => enregistrer(parametre)}>
                        {t('common.save')}
                    </Button>
                </Stack>
            );
        }
        return (
            <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                    size="small"
                    type="number"
                    value={saisie}
                    onChange={(e) => setSaisies((s) => ({ ...s, [cle]: e.target.value }))}
                    inputProps={{ min, max, 'aria-label': t(`ref.settings.labels.${cle}`) }}
                    InputProps={{ endAdornment: <InputAdornment position="end">{type === 'pourcentage' ? '%' : unite}</InputAdornment> }}
                    sx={{ width: 150 }}
                />
                <Button variant="outlined" size="small" onClick={() => enregistrer(parametre)}>
                    {t('common.save')}
                </Button>
            </Stack>
        );
    };

    return (
        <DashboardLayout>
            <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                        {t('ref.settings.intro')}
                    </Typography>
                </Box>
                {!parametres ? (
                    <Box sx={{ p: 2 }}>
                        <TableSkeleton rows={7} />
                    </Box>
                ) : (
                    PARAMETRES.map((parametre) => (
                        <Box
                            key={parametre.cle}
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 1fr) minmax(320px, 1.2fr)' },
                                gap: { xs: 1.5, md: 3 },
                                alignItems: 'center',
                                px: { xs: 1.5, md: 2 },
                                py: 2,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
                                        {t(`ref.settings.labels.${parametre.cle}`)}
                                    </Typography>
                                    {parametres[parametre.cle].modifie && <StateChip tone="info">{t('ref.settings.modified')}</StateChip>}
                                </Stack>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {t(`ref.settings.help.${parametre.cle}`)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    {t('ref.settings.default', { value: valeurDefaut(parametre) })}
                                    {parametres[parametre.cle].modifie && (
                                        <Button size="small" onClick={() => retablir(parametre.cle)} sx={{ ml: 1, minHeight: 0, py: 0 }}>
                                            {t('ref.settings.reset')}
                                        </Button>
                                    )}
                                </Typography>
                            </Box>
                            <Box>{controle(parametre)}</Box>
                        </Box>
                    ))
                )}
            </Paper>
        </DashboardLayout>
    );
}
