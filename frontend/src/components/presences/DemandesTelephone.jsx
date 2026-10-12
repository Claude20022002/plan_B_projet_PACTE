import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { PhonelinkSetup } from '@mui/icons-material';
import { presenceAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';

/**
 * Changements de téléphone demandés par les étudiants depuis l'application (R-10). Accepter lie le
 * téléphone déclaré, et lui seul : un autre reste refusé au scan. Refuser laisse l'ancien en place
 * et prévient l'étudiant, avec le motif s'il y en a un. Rien n'est affiché sans demande en attente.
 */
export default function DemandesTelephone({ onDecision }) {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [demandes, setDemandes] = useState([]);
    const [occupe, setOccupe] = useState(null);
    const [aRefuser, setARefuser] = useState(null);
    const [motif, setMotif] = useState('');

    const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
    const dateHeure = (valeur) => (valeur ? new Date(valeur).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }) : '-');

    const charger = useCallback(async () => {
        try {
            setDemandes((await presenceAPI.demandesTelephone()).data ?? []);
        } catch {
            toast.error(t('common.errorLoad'));
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const decider = async (demande, accepter, raison = '') => {
        setOccupe(demande.id);
        try {
            if (accepter) await presenceAPI.accepterDemandeTelephone(demande.id);
            else await presenceAPI.refuserDemandeTelephone(demande.id, raison.trim());
            toast.success(t(accepter ? 'demandesTelephone.acceptee' : 'demandesTelephone.refusee', { nom: demande.etudiant?.nom }));
            setDemandes((liste) => liste.filter((d) => d.id !== demande.id));
            onDecision?.();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            charger();
        } finally {
            setOccupe(null);
        }
    };

    if (!demandes.length) return null;
    return (
        <Box component="section" aria-labelledby="demandes-telephone" sx={{ mb: 3 }}>
            <Typography id="demandes-telephone" variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t('demandesTelephone.titre', { count: demandes.length })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 820 }}>
                {t('demandesTelephone.intro')}
            </Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.xs}px` }}>
                {demandes.map((d, i) => (
                    <Stack
                        key={d.id}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={{ xs: 0.5, md: 1.5 }}
                        alignItems={{ md: 'center' }}
                        sx={{ px: 1.5, py: 1, borderBottom: i < demandes.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
                    >
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, fontVariantNumeric: 'tabular-nums' }}>
                            {dateHeure(d.demandee_le)}
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PhonelinkSetup fontSize="small" sx={{ color: 'warning.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {d.etudiant?.nom ?? '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {d.etudiant?.email}
                                </Typography>
                            </Stack>
                            <Typography variant="body2">{d.motif || t('demandesTelephone.sansMotif')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {d.telephone_lie_le ? t('demandesTelephone.ancienLieLe', { date: dateHeure(d.telephone_lie_le) }) : t('signalementsPresence.aucunTelephone')}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: { md: 'flex-end' } }}>
                            <Button size="small" variant="contained" disabled={occupe === d.id} onClick={() => decider(d, true)}>
                                {t('demandesTelephone.accepter')}
                            </Button>
                            <Button size="small" variant="outlined" disabled={occupe === d.id} onClick={() => { setMotif(''); setARefuser(d); }}>
                                {t('demandesTelephone.refuser')}
                            </Button>
                        </Stack>
                    </Stack>
                ))}
            </Box>

            <Dialog open={Boolean(aRefuser)} onClose={() => setARefuser(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('demandesTelephone.refuserTitre', { nom: aRefuser?.etudiant?.nom ?? '' })}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        minRows={2}
                        sx={{ mt: 1 }}
                        label={t('demandesTelephone.motifRefus')}
                        helperText={t('demandesTelephone.motifRefusAide')}
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        inputProps={{ maxLength: 255 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setARefuser(null)}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            const cible = aRefuser;
                            setARefuser(null);
                            decider(cible, false, motif);
                        }}
                    >
                        {t('demandesTelephone.refuser')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
