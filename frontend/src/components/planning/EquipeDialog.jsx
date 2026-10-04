import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import StateChip from '../../design-system/components/StateChip';
import { enseignementAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';
import { TON_SERVICE, principalActif } from '../../utils/services';

const ROLES = ['principal', 'co_enseignant'];
/**
 * Équipe pédagogique d'un enseignement : le responsable propose un principal et des
 * co-enseignants (les candidats compétents d'abord, avec leur charge), retire une proposition.
 */
export default function EquipeDialog({ enseignement, onClose, onChange }) {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [candidats, setCandidats] = useState([]);
    const [choix, setChoix] = useState(null);
    const [role, setRole] = useState('principal');
    const [heures, setHeures] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);
    const id = enseignement?.id_enseignement;
    const services = useMemo(() => enseignement?.services ?? [], [enseignement]);
    const aUnPrincipal = Boolean(principalActif(services));

    useEffect(() => {
        if (!id) return;
        setChoix(null);
        setHeures('');
        enseignementAPI
            .getCandidats(id)
            .then(setCandidats)
            .catch(() => toast.error(t('common.errorLoad')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, services.length]);

    useEffect(() => {
        setRole(aUnPrincipal ? 'co_enseignant' : 'principal');
    }, [aUnPrincipal, id]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const proposer = async (event) => {
        event.preventDefault();
        if (!choix) return;
        setEnvoi(true);
        try {
            const reponse = await enseignementAPI.ajouterEnseignant(id, { id_user: choix.id_user, role, ...(heures !== '' && { heures: Number(heures) }) });
            toast.success(t('ref.teaching.team.proposed'));
            if (reponse.avertissement) toast.warning(reponse.avertissement);
            onChange();
        } catch (error) {
            erreur(error);
        } finally {
            setEnvoi(false);
        }
    };

    const retirer = async (service) => {
        try {
            await enseignementAPI.retirerEnseignant(id, service.id_user);
            toast.success(t('ref.teaching.team.removed'));
            onChange();
        } catch (error) {
            erreur(error);
        }
    };

    const module = enseignement?.composante?.cours;

    return (
        <Dialog open={Boolean(enseignement)} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {t('ref.teaching.team.title')}
                <Typography variant="body2" color="text.secondary">
                    {enseignement?.libelle || module?.nom_cours} · {enseignement?.composante?.type} · {enseignement?.groupes?.map((g) => g.nom_groupe).join(', ')}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('ref.teaching.team.intro')}
                </Typography>

                {services.length === 0 ? (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {t('ref.teaching.team.empty')}
                    </Typography>
                ) : (
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }}>
                        {services.map((s) => (
                            <Stack key={s.id_user} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {s.enseignant?.prenom} {s.enseignant?.nom}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t(`ref.teaching.roles.${s.role}`)}
                                        {s.heures != null && ` · ${nombre.format(s.heures)} h`}
                                        {s.statut_service === 'refuse' && s.motif_refus && ` · ${t('ref.teaching.team.refusedBecause', { reason: s.motif_refus })}`}
                                    </Typography>
                                </Box>
                                {TON_SERVICE[s.statut_service] && <StateChip tone={TON_SERVICE[s.statut_service]}>{t(`ref.teaching.serviceStatus.${s.statut_service}`)}</StateChip>}
                                <IconButton size="small" onClick={() => retirer(s)} aria-label={t('ref.teaching.team.remove', { name: `${s.enseignant?.prenom} ${s.enseignant?.nom}` })}>
                                    <Close fontSize="small" />
                                </IconButton>
                            </Stack>
                        ))}
                    </Box>
                )}

                <Box component="form" onSubmit={proposer}>
                    <Stack spacing={1.5}>
                        <Autocomplete
                            options={candidats}
                            value={choix}
                            onChange={(_, valeur) => setChoix(valeur)}
                            getOptionLabel={(c) => `${c.nom} ${c.prenom}`}
                            isOptionEqualToValue={(a, b) => a.id_user === b.id_user}
                            groupBy={(c) => (c.competent ? t('ref.teaching.team.competent') : t('ref.teaching.team.others'))}
                            renderOption={({ key, ...props }, c) => (
                                <Box component="li" key={key} {...props} sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2">
                                            {c.nom} {c.prenom}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {t(`ref.staff.statuses.${c.statut}`)}
                                            {c.departement ? ` · ${c.departement}` : ''}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ fontFamily: ds.font.board, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        {c.service_du
                                            ? t('ref.teaching.team.loadDue', { hours: nombre.format(c.heures_prevues), due: nombre.format(c.service_du) })
                                            : t('ref.teaching.team.load', { hours: nombre.format(c.heures_prevues) })}
                                    </Typography>
                                </Box>
                            )}
                            renderInput={(params) => <TextField {...params} label={t('ref.teaching.team.candidate')} size="small" />}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <TextField select size="small" label={t('ref.teaching.team.role')} value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 180 }}>
                                {ROLES.map((r) => (
                                    <MenuItem key={r} value={r} disabled={r === 'principal' && aUnPrincipal}>
                                        {t(`ref.teaching.roles.${r}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                size="small"
                                type="number"
                                label={t('ref.teaching.team.hours')}
                                helperText={t('ref.teaching.team.hoursHelp')}
                                value={heures}
                                onChange={(e) => setHeures(e.target.value)}
                                inputProps={{ min: 0.5, step: 0.5 }}
                                sx={{ flex: 1 }}
                            />
                        </Stack>
                        <Box>
                            <Button type="submit" variant="contained" disabled={!choix || envoi}>
                                {t('ref.teaching.team.add')}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
