import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { PhonelinkErase, ReportProblemOutlined } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../design-system/components/EmptyState';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { presenceAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';

const MOTIFS = ['autre_telephone', 'telephone_d_un_autre', 'appareil_partage', 'absent_verification'];

/**
 * Signalements de présence (anti-fraude, lot 2), écran de l'administration : les soupçons de fraude
 * à l'appel, du plus récent au plus ancien. Un compte est lié à un téléphone à son premier scan ;
 * un étudiant qui a changé de téléphone est refusé tant que l'ancien reste lié : on le délie ici,
 * son prochain scan liera le nouveau.
 */
export default function SignalementsPresence() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [signalements, setSignalements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [motif, setMotif] = useState('');
    const [aDelier, setADelier] = useState(null);

    const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';
    const dateHeure = (valeur) => new Date(valeur).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
    const date = (valeur) => (valeur ? new Date(`${valeur}T12:00:00`).toLocaleDateString(locale) : '-');

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            setSignalements((await presenceAPI.signalements()).data ?? []);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const visibles = useMemo(() => (motif ? signalements.filter((s) => s.motif === motif) : signalements), [signalements, motif]);

    const delier = async () => {
        const cible = aDelier;
        setADelier(null);
        try {
            await presenceAPI.delierTelephone(cible.id_user);
            toast.success(t('signalementsPresence.delie', { nom: cible.etudiant }));
            setSignalements((liste) => liste.map((s) => (s.id_user === cible.id_user ? { ...s, telephone_lie_le: null } : s)));
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <TextField select size="small" label={t('signalementsPresence.motif')} value={motif} onChange={(e) => setMotif(e.target.value)} sx={{ minWidth: 260 }}>
                        <MenuItem value="">{t('signalementsPresence.tousMotifs')}</MenuItem>
                        {MOTIFS.map((m) => (
                            <MenuItem key={m} value={m}>
                                {t(`signalementsPresence.motifs.${m}`, { lie: '…' })}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                    {t('signalementsPresence.intro')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : visibles.length === 0 ? (
                    <EmptyState title={t('signalementsPresence.videTitre')} description={t('signalementsPresence.videTexte')} />
                ) : (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.xs}px` }}>
                        {visibles.map((s, i) => (
                            <Stack
                                key={s.id}
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={{ xs: 0.5, md: 1.5 }}
                                alignItems={{ md: 'center' }}
                                sx={{ px: 1.5, py: 1, borderBottom: i < visibles.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
                            >
                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, fontVariantNumeric: 'tabular-nums' }}>
                                    {dateHeure(s.le)}
                                </Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <ReportProblemOutlined fontSize="small" sx={{ color: 'warning.main' }} />
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {s.etudiant ?? '-'}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body2">{t(`signalementsPresence.motifs.${s.motif}`, { lie: s.lie ?? '?' })}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {[s.seance.cours, s.seance.groupe, date(s.seance.date)].filter(Boolean).join(' · ')}
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { md: 300 }, justifyContent: { md: 'flex-end' } }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {s.telephone_lie_le ? t('signalementsPresence.lieLe', { date: dateHeure(s.telephone_lie_le) }) : t('signalementsPresence.aucunTelephone')}
                                    </Typography>
                                    {s.telephone_lie_le && (
                                        <Button size="small" variant="outlined" startIcon={<PhonelinkErase />} onClick={() => setADelier(s)}>
                                            {t('signalementsPresence.delier')}
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        ))}
                    </Box>
                )}
            </Paper>

            <ConfirmDialog
                open={Boolean(aDelier)}
                title={t('signalementsPresence.delierTitre', { nom: aDelier?.etudiant ?? '' })}
                message={t('signalementsPresence.delierMessage')}
                confirmLabel={t('signalementsPresence.delier')}
                confirmColor="primary"
                onConfirm={delier}
                onCancel={() => setADelier(null)}
            />
        </DashboardLayout>
    );
}
