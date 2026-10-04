import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import EmptyState from '../design-system/components/EmptyState';
import StateChip from '../design-system/components/StateChip';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { enseignantAPI, serviceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ds, lineColor } from '../design-system/tokens';

const SECTIONS = ['propose', 'accepte', 'refuse'];

/**
 * Espace enseignant : les enseignements que le responsable de filière lui propose, à accepter
 * ou à refuser (motif obligatoire), et sa charge de l'année face au service dû.
 */
export default function MesServices() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [charge, setCharge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refus, setRefus] = useState(null);

    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);

    const charger = useCallback(async () => {
        if (!user?.id_user) return;
        try {
            const [liste, maCharge] = await Promise.all([serviceAPI.getMesServices(), enseignantAPI.getCharge(user.id_user).catch(() => null)]);
            setServices(liste);
            setCharge(maCharge);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [user?.id_user, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const repondre = async (service, statut, motif) => {
        try {
            await serviceAPI.repondre(service.id_enseignement, { statut, ...(motif && { motif }) });
            toast.success(t(statut === 'accepte' ? 'ref.services.acceptedToast' : 'ref.services.refusedToast'));
            setRefus(null);
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const aRepondre = services.filter((s) => s.statut_service === 'propose').length;

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ maxWidth: 640 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {aRepondre > 0 ? t('ref.services.toAnswer', { count: aRepondre }) : t('ref.services.allAnswered')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('ref.services.intro')}
                        </Typography>
                    </Box>
                    {charge && <ChargeResume charge={charge} nombre={nombre} />}
                </Box>

                {loading ? (
                    <TableSkeleton rows={5} />
                ) : services.length === 0 ? (
                    <EmptyState title={t('ref.services.emptyTitle')} description={t('ref.services.emptyBody')} />
                ) : (
                    SECTIONS.map((statut) => {
                        const liste = services.filter((s) => s.statut_service === statut);
                        if (liste.length === 0) return null;
                        return (
                            <Box key={statut} component="section" sx={{ mt: 2 }}>
                                <Typography component="h2" sx={{ fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8125rem', color: 'text.secondary', mb: 0.5 }}>
                                    {t(`ref.services.sections.${statut}`)} · {liste.length}
                                </Typography>
                                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                    {liste.map((service) => (
                                        <LigneService
                                            key={`${service.id_enseignement}-${service.id_user}`}
                                            service={service}
                                            nombre={nombre}
                                            onAccepter={() => repondre(service, 'accepte')}
                                            onRefuser={() => setRefus({ service, motif: '' })}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Paper>

            <Dialog open={Boolean(refus)} onClose={() => setRefus(null)} maxWidth="xs" fullWidth>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        repondre(refus.service, 'refuse', refus.motif.trim());
                    }}
                >
                    <DialogTitle>
                        {t('ref.services.refuseTitle')}
                        <Typography variant="body2" color="text.secondary">
                            {refus?.service.enseignement.composante.cours.nom_cours} · {refus?.service.enseignement.composante.type}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            label={t('ref.services.reason')}
                            helperText={t('ref.services.reasonHelp')}
                            value={refus?.motif ?? ''}
                            onChange={(e) => setRefus((r) => ({ ...r, motif: e.target.value }))}
                            required
                            multiline
                            minRows={2}
                            fullWidth
                            autoFocus
                            sx={{ mt: 1 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRefus(null)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={!refus?.motif.trim()}>
                            {t('ref.services.refuse')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </DashboardLayout>
    );
}

function ChargeResume({ charge, nombre }) {
    const { t } = useTranslation();
    const valeurs = [
        { label: t('ref.services.accepted'), value: `${nombre.format(charge.heures_acceptees)} h` },
        { label: t('ref.services.pending'), value: `${nombre.format(charge.heures_proposees)} h` },
        { label: t('ref.services.due'), value: charge.service_du ? `${nombre.format(charge.service_du)} h` : '—' },
    ];
    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.xs}px`, px: 1.5, py: 1, minWidth: 260 }}>
            <Typography variant="caption" color="text.secondary">
                {t('ref.services.load', { year: charge.annee?.libelle ?? '' })}
            </Typography>
            <Stack direction="row" spacing={2.5} sx={{ mt: 0.5 }}>
                {valeurs.map((v) => (
                    <Box key={v.label}>
                        <Typography sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{v.value}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {v.label}
                        </Typography>
                    </Box>
                ))}
            </Stack>
            {!charge.service_du && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {t('ref.services.noDue')}
                </Typography>
            )}
        </Box>
    );
}

function LigneService({ service, nombre, onAccepter, onRefuser }) {
    const { t } = useTranslation();
    const { enseignement } = service;
    const module = enseignement.composante.cours;
    const heures = service.heures ?? enseignement.heures_prevues;
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1.4fr) auto' },
                gap: { xs: 1, md: 2 },
                alignItems: 'center',
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <Box component="span" aria-hidden sx={{ width: 9, height: 9, mt: 0.75, borderRadius: '2px', flexShrink: 0, bgcolor: lineColor(module.id_filiere) }} />
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {enseignement.libelle || module.nom_cours}
                        </Typography>
                        <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                            {enseignement.composante.type}
                        </Typography>
                        {service.role === 'co_enseignant' && <StateChip tone="info">{t('ref.services.co')}</StateChip>}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        {module.code_cours} · {module.filiere?.code_filiere} · {module.semestre}
                        {enseignement.periode ? ` · ${enseignement.periode.code}` : ''}
                    </Typography>
                    {service.statut_service === 'refuse' && service.motif_refus && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {t('ref.teaching.team.refusedBecause', { reason: service.motif_refus })}
                        </Typography>
                    )}
                </Box>
            </Stack>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2">{enseignement.groupes.map((g) => g.nom_groupe).join(', ')}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {nombre.format(heures)} h · {t('ref.services.students', { count: enseignement.groupes.reduce((total, g) => total + (g.effectif || 0), 0) })}
                </Typography>
            </Box>
            {service.statut_service === 'propose' ? (
                <Stack direction="row" spacing={1} sx={{ justifySelf: { md: 'end' } }}>
                    <Button size="small" variant="outlined" onClick={onRefuser}>
                        {t('ref.services.refuse')}
                    </Button>
                    <Button size="small" variant="contained" onClick={onAccepter}>
                        {t('ref.services.accept')}
                    </Button>
                </Stack>
            ) : (
                <Box sx={{ justifySelf: { md: 'end' } }}>{service.statut_service === 'refuse' && <StateChip tone="neutral">{t('ref.teaching.serviceStatus.refuse')}</StateChip>}</Box>
            )}
        </Box>
    );
}
